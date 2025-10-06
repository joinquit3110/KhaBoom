// =============================================================================
// KHA-BOOM! Express App with Performance Optimizations
// (c) Kha-Boom!
// =============================================================================


import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import bodyParser from 'body-parser';
import lusca from 'lusca';
import session from 'express-session';
import path from 'path';
import flash from 'express-flash';
import {safeToJSON} from '@mathigon/core';

import {search, SEARCH_DOCS} from './search';
import {CourseRequestOptions, ServerOptions} from './interfaces';
import setupAuthEndpoints from './accounts';
import {getMongoStore} from './utilities/mongodb';
import {OAUTHPROVIDERS} from './utilities/oauth';
import {cacheBust, CONFIG, CONTENT_DIR, COURSES, ENV, findNextSection, getCourse, href, include, IS_PROD, lighten, loadYAML, ONE_YEAR, OUT_DIR, PROJECT_DIR, promisify, removeCacheBust} from './utilities/utilities';
import {AVAILABLE_LOCALES, getCountry, getLocale, isInEU, Locale, LOCALES, translate} from './utilities/i18n';
import {User, UserDocument} from './models/user';
import {CourseAnalytics, LoginAnalytics} from './models/analytics';
import {ChangeData, Progress} from './models/progress';

// Import parseSimple for glossary processing
const {parseSimple} = require('../build/markdown/parser');

// Performance cache for frequently accessed data
const memoryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function setCache(key: string, value: any, ttl: number = CACHE_TTL) {
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttl
  });
}

function getCache(key: string) {
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  memoryCache.delete(key);
  return null;
}

// Helper function to parse glossary data like course does with caching
async function parseGlossaryData(rawData: {[key: string]: {title: string, text: string}}) {
  const cacheKey = `glossary_${crypto.createHash('md5').update(JSON.stringify(rawData)).digest('hex')}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const parsed: {[key: string]: {title: string, text: string}} = {};
  
  for (const [key, value] of Object.entries(rawData)) {
    try {
      // Parse the text field with markdown/LaTeX support
      const parsedText = await parseSimple(value.text || '');
      parsed[key] = {
        title: value.title,
        text: parsedText
      };
    } catch (error) {
      console.warn(`Failed to parse glossary entry ${key}:`, error);
      // Fallback to original text if parsing fails
      parsed[key] = value;
    }
  }
  
  setCache(cacheKey, parsed);
  return parsed;
}


declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      country: string;
      locale: Locale;
      __: (str: string, ...args: string[]) => string;
      user?: UserDocument;
      tmpUser: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    auth?: {user?: string};
    redirectTo?: string;
  }
}


const STATUS_CODES: Record<string, string> = {
  401: 'You don’t have access to this page,',
  404: 'This page doesn’t exist.',
  default: 'Something went wrong.'
};

const SESSION_COOKIE = {
  domain: IS_PROD ? CONFIG.domain : undefined,
  maxAge: 1000 * 60 * 60 * 24 * 60  // Two months, in ms
};


// -----------------------------------------------------------------------------
// Express App Setup

export class MathigonStudioApp {
  private app: express.Application;

  constructor() {
    const app = this.app = express();
    app.set('env', ENV);
    app.set('trust_proxy', true);
    app.set('views', [PROJECT_DIR + '/server/templates', __dirname + '/templates']);
    app.set('view engine', 'pug');
    if (ENV === 'development') app.set('json spaces', 2);
    app.disable('x-powered-by');
  }


  use(fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>) {
    this.app.use(fn);
    return this;
  }

  get(url: string, handler: (req: express.Request, res: express.Response, next: express.NextFunction) => void) {
    this.app.get(url, promisify(handler));
    return this;
  }

  post(url: string, handler: (req: express.Request, res: express.Response, next: express.NextFunction) => void) {
    this.app.post(url, promisify(handler));
    return this;
  }

  listen(port?: number) {
    port = (+process.env.PORT!) || port || 8080;
    this.app.set('port', port);
    this.app.listen(port, () => console.log(`Running on port ${port} in ${ENV} mode.`));
  }

  // Get the Express app instance for extending with custom routes
  getApp(): express.Application {
    return this.app;
  }


  // ---------------------------------------------------------------------------
  // Server Configuration

  /**
   * Sets up the express body and cookie parser, as well as security headers.
   * This should happen *after* binding static assets repositories.
   * @param options {ServerOptions}
   * @return {MathigonStudioApp}
   */
  setup(options: ServerOptions) {
    this.app.use(cookieParser(options.sessionSecret));
    this.app.use(flash());

    const limit = options?.maxBodySize || '400kb';
    this.app.use(bodyParser.json({limit}) as express.RequestHandler);
    this.app.use(bodyParser.urlencoded({extended: false, limit}) as express.RequestHandler);

    this.app.use(session({
      name: 'session',
      secret: options.sessionSecret,
      cookie: SESSION_COOKIE,
      resave: false,  // Don't save session if unmodified
      saveUninitialized: false,  // Don't create session until something stored
      store: CONFIG.accounts.enabled ? getMongoStore() : undefined
    }));

    this.app.use(lusca({
      csrf: {blocklist: options?.csrfBlocklist},  // Cross Site Request Forgery
      hsts: {maxAge: 31536000},                   // Strict-Transport-Security
      nosniff: true,                              // X-Content-Type-Options
      xssProtection: true                        // X-XSS-Protection
    }));

    this.app.use((req, res, next) => {
      req.url = removeCacheBust(req.url);
      req.country = getCountry(req);
      req.locale = getLocale(req);
      req.__ = (str: string, ...args: string[]) => translate(req.locale.id, str, args);

      // These keys are required by the error page, so they need to be added
      // before any static files routing (which might throw an error).
      const showCookieConsent = !req.cookies.cookie_consent && isInEU(req.country);
      Object.assign(res.locals, {
        country: req.country, locale: req.locale, __: req.__, env: ENV, req,
        availableLocales: AVAILABLE_LOCALES, config: CONFIG, include,
        href: href.bind(undefined, req), basedir: __dirname + '/templates',
        search: {docs: SEARCH_DOCS}, showCookieConsent, getCourse,
        cacheBust: (file: string) => cacheBust(file, req.locale),
        oAuthProviders: OAUTHPROVIDERS
      });

      next();
    });

    // Static asset directories
    this.app.use(compression());
    this.app.use(express.static(PROJECT_DIR + '/frontend/assets', {maxAge: ONE_YEAR}));
    this.app.use(express.static(path.join(__dirname, '../frontend/assets'), {maxAge: ONE_YEAR}));
    this.app.use(express.static(OUT_DIR, {maxAge: ONE_YEAR}));
    this.app.use('/content', express.static(CONTENT_DIR, {maxAge: ONE_YEAR}));

    // Search Endpoint
    if (CONFIG.search.enabled) {
      this.get('/api/search', (req, res) => {
        res.locals.search.results = search((req.query.q || '').toString());
        res.render('search');
      });
    }

    return this;
  }

  secure() {
    this.app.use((req, res, next) => {
      // See https://cloud.google.com/appengine/docs/flexible/nodejs/reference/request-headers
      if (req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
        return res.redirect(`https://${req.hostname}${req.url}`);
      }
      next();
    });
    return this;
  }


  // ---------------------------------------------------------------------------
  // Helper Functions

  /**
   * Create redirect handlers for a map of URLs. It is possible to use and
   * reference URL parameters, e.g. {"/:name": "/course/$name"}.
   * @param data {Record<string, string>}
   * @return {MathigonStudioApp}
   */
  redirects(data: Record<string, string>) {
    for (const from of Object.keys(data)) {
      this.app.get(from, (req, res) => {
        let url = data[from];
        for (const [key, value] of Object.entries(req.params)) {
          url = url.replace('$' + key, value);
        }
        res.redirect(url);
      });
    }

    return this;
  }

  /**
   * Bind Express error handlers. This should be called after all other
   * request handlers have been set up.
   * @return {MathigonStudioApp}
   */
  errors() {
    const render = (req: express.Request, res: express.Response, error?: Error) => {
      res.render('error', {
        code: res.statusCode, error,
        message: STATUS_CODES[res.statusCode] || STATUS_CODES.default,
        url: req.url
      });
    };

    this.app.use((req, res) => {
      res.status(404);
      if (req.accepts('html')) {
        render(req, res);
      } else if (req.accepts('json')) {
        res.send({error: 'Not found'});
      } else {
        res.type('txt').send('Not found');
      }
    });

    this.app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error.name === 'URIError') {
        // This handles requests with invalid query parameters that can't be parsed by Express.
        res.status(400);
      } else if (res.statusCode === 200) {
        res.status(500);
      }
      render(req, res, error);
    });

    return this;
  }

  // ---------------------------------------------------------------------------
  // Setup Authentication and Dashboard Routes

  accounts() {
    this.app.use(async (req, res, next) => {
      if (!req.session.auth) req.session.auth = {};

      if (req.session.auth.user) {
        req.user = await User.findById(req.session.auth.user) || undefined;
      } else if (req.cookies.tmp_user) {
        req.tmpUser = req.cookies.tmp_user;
      } else {
        req.tmpUser = crypto.randomBytes(16).toString('hex');
        res.cookie('tmp_user', req.tmpUser, SESSION_COOKIE);
      }

      if (req.user) await LoginAnalytics.ping(req.user);
      res.locals.user = req.user;
      next();
    });

    setupAuthEndpoints(this);

    this.get('/dashboard', async (req, res) => {
      // Disable caching for dashboard to always show fresh data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', '"' + Date.now() + '"');
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // Temporarily allow access without login for testing
      if (!req.user) {
        // Create a dummy user for testing
        const dummyProgress = null;
        const dummyStats = { streak: 0, points: 0, hours: 0 };
        const recent: any[] = [];
        const recommended: any[] = [];
        const leaderboard: any[] = [];

        // Load glossary data from shared glossary.yaml
        let glossaryData: {[key: string]: {title: string, text: string}} = {};
        try {
          const glossaryPath = path.join(CONTENT_DIR, 'shared', 'glossary.yaml');
          console.log('Loading glossary from path:', glossaryPath);
          const sharedGlossary = await loadYAML(glossaryPath) || {};
          console.log('Raw glossary loaded:', Object.keys(sharedGlossary).length, 'keys');
          
          // For dashboard, include ALL glossary terms from shared
          const rawGlossaryData = sharedGlossary as {[key: string]: {title: string, text: string}};
          
          // Add dashboard-specific terms
          rawGlossaryData.dashboard = {title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.'};
          rawGlossaryData.learning = {title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.'};
          rawGlossaryData.progress = {title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.'};
          rawGlossaryData.ai = {title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.'};
          rawGlossaryData.mentor = {title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.'};
          
        // Parse markdown/LaTeX in glossary text like course does
        glossaryData = await parseGlossaryData(rawGlossaryData);
          
          console.log('Sample terms:', Object.keys(glossaryData).slice(0, 5));
        } catch (error) {
          console.warn('Could not load glossary data:', error);
          // Fallback glossary data
          glossaryData = {
            dashboard: {title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.'},
            learning: {title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.'},
            progress: {title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.'},
            ai: {title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.'},
            mentor: {title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.'}
          };
        }

        return res.render('dashboard', {progress: dummyProgress, recent, recommended, stats: dummyStats, leaderboard, glossaryData});
      }

      const progress = await Progress.getUserData(req.user.id);
      const stats = await CourseAnalytics.getLastWeekStats(req.user.id);
      
      // Get recent course IDs and map them to course objects with progress
      const recentIds = (await Progress.getRecentCourses(req.user.id)).slice(0, 12);
      const recent = recentIds.map(id => {
        const course = getCourse(id, req.locale.id);
        if (!course) return null;
        const courseProgress = progress.get(id);
        const progressValue = courseProgress ? courseProgress.progress : 0;
        return {
          id,
          name: course.title,
          hero: course.hero || course.icon || '/images/placeholder.jpg',
          icon: course.icon,
          url: course.sections[0].url,
          progress: progressValue,
          description: course.description || `Discover the exciting world of ${course.title.toLowerCase()}`,
          color: course.color,
          // Add flag to indicate if this is a newly accessed course
          isNewlyAccessed: progressValue === 0 && courseProgress
        };
      }).filter(Boolean);

      // Show more recommended courses if user has few recent courses
      const items = Math.max(4, 12 - recent.length);
      const recommended = COURSES.filter(x => {
        const courseProgress = progress.get(x);
        // Show course if no progress record OR progress is 0% (clicked but not started)
        return !courseProgress || courseProgress.progress === 0;
      }).slice(0, items).map(id => {
        const course = getCourse(id, req.locale.id);
        if (!course) return null;
        return {
          id,
          name: course.title,
          hero: course.hero || course.icon || '/images/placeholder.jpg',
          icon: course.icon,
          url: course.sections[0].url,
          description: course.description || `Discover the exciting world of ${course.title.toLowerCase()}`,
          color: course.color
        };
      }).filter(Boolean);
      
      // Fetch leaderboard data - top 10 users by points
      const leaderboard = await CourseAnalytics.getLeaderboard();

      // Load glossary data from shared glossary.yaml
      let glossaryData: {[key: string]: {title: string, text: string}} = {};
      try {
        const glossaryPath = path.join(CONTENT_DIR, 'shared', 'glossary.yaml');
        const sharedGlossary = await loadYAML(glossaryPath) || {};
        
        // For dashboard, include ALL glossary terms from shared
        const rawGlossaryData = sharedGlossary as {[key: string]: {title: string, text: string}};
        // Add dashboard-specific terms
        rawGlossaryData.dashboard = {title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.'};
        rawGlossaryData.learning = {title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.'};
        rawGlossaryData.progress = {title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.'};
        rawGlossaryData.ai = {title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.'};
        rawGlossaryData.mentor = {title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.'};
        
        // Parse markdown/LaTeX in glossary text like course does
        glossaryData = await parseGlossaryData(rawGlossaryData);
        
      } catch (error) {
        console.warn('Could not load glossary data:', error);
        // Fallback glossary data
        glossaryData = {
          dashboard: {title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.'},
          learning: {title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.'},
          progress: {title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.'},
          ai: {title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.'},
          mentor: {title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.'}
        };
      }

      res.render('dashboard', {progress, recent, recommended, stats, leaderboard, glossaryData});
    });

    return this;
  }


  // ---------------------------------------------------------------------------
  // Setup Course Routes

  /**
   * Bind request handlers for all course pages, including getters and POST
   * requests for saving progress, sending feedback and asking tutor queries.
   * @param options {CourseRequestOptions}
   */
  course(options: CourseRequestOptions = {}) {
    // Middleware to check authentication for course access
    const requireAuth = (handler: (req: express.Request, res: express.Response, next: express.NextFunction) => void) => {
      return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user && CONFIG.accounts.enabled) {
          // Store the intended URL in session for redirect after login
          req.session.redirectTo = req.originalUrl;
          return res.redirect('/');
        }
        handler(req, res, next);
      };
    };

    this.get('/course/:course', requireAuth((req, res, next) => {
      const course = getCourse(req.params.course, req.locale.id);
      return course ? res.redirect(course.sections[0].url) : next();
    }));

    this.get('/course/:course/:section', requireAuth(async (req, res, next) =>{
      const course = getCourse(req.params.course, req.locale.id);
      const section = course?.sections.find(s => s.id === req.params.section);
      if (!course || !section) return next();

      // Disable caching for course pages to show fresh progress
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('ETag', '"' + Date.now() + '"');
      res.setHeader('Last-Modified', new Date().toUTCString());

      const progressData = await Progress.lookup(req, course.id);
      const nextSection = findNextSection(course, section);
      const prevSection = findNextSection(course, section, -1);

      if (req.user) CourseAnalytics.track(req.user.id);  // async

      res.locals.availableLocales = course.availableLocales.map(l => LOCALES[l]);
      // Note: nextUp is provided as a legacy fallback for previous versions.
      res.render('course', {course, section, lighten, progressData, nextSection, prevSection, nextUp: nextSection});
    }));

    this.post('/course/:course/:section', async (req, res, next) => {
      if (!CONFIG.accounts.enabled) return res.status(200).send('ok');

      const course = getCourse(req.params.course, req.locale.id);
      const section = course?.sections.find(s => s.id === req.params.section);
      if (!course || !section) return next();

      const changes = safeToJSON<ChangeData>(req.body.data, {});
      if (!changes) return res.status(400).send(STATUS_CODES[400]);

      const progress = (await Progress.lookup(req, course.id, true))!;
      const newScoreCount = progress.updateData(section.id, changes);
      await progress.save();

      if (req.user) CourseAnalytics.track(req.user.id, newScoreCount);  // async
      res.status(200).send('ok');
    });

    this.post('/course/:course/reset', async (req, res, next) => {
      const course = getCourse(req.params.course, req.locale.id);
      if (!course) return next();
      
      try {
        // Delete the progress data
        if (CONFIG.accounts.enabled) {
          await Progress.delete(req, course.id);
        }
        
        // Redirect to the first section of the course with success parameter
        res.redirect(`/course/${req.params.course}/${course.sections[0].id}?reset=success`);
      } catch (error) {
        console.error('Error resetting progress:', error);
        res.redirect(`/course/${req.params.course}`);
      }
    });

    this.post('/course/:course/feedback', async (req, res, next) => {
      if (!CONFIG.courses.feedback) return next();
      const course = getCourse(req.params.course, req.locale.id);
      if (!course) return next();

      const response = await options.sendFeedback?.(req, course);
      res.status(response?.status || 200).end();
    });

    this.post('/course/:course/ask', async (req, res, next) => {
      const course = getCourse(req.params.course, req.locale.id);
      if (!course) return next();

      const response = await options.askTutor?.(req, course);
      res.status(response?.status || 200).json(response?.data || {}).end();
    });

    return this;
  }
}
