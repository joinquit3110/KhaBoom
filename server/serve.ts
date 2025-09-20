#!/usr/bin/env -S ts-node --script-mode

// Kha-Boom! Development Server
// Enhanced with modern UI/UX

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import {createServer} from 'http';
import {MathigonStudioApp} from './app';
import {COURSES, getCourse} from './utilities/utilities';
import {setupWebSocket} from './websocket';
import {Progress} from './models/progress';
import {aiService} from './services/ai-service';

const studioApp = new MathigonStudioApp()
    .secure()
    .setup({sessionSecret: 'khaboom-secret-2024'})
    .accounts()  // Enable accounts system
    
    // Landing page (new home) - redirect to dashboard if logged in
    .get('/', (req, res) => {
        if (req.user) return res.redirect('/dashboard');
        res.render('landing.pug', {
            user: req.user,
            theme: req.cookies.theme || 'dark'
        });
    })
    
    // Courses page - show progress for logged-in users
    .get('/courses', async (req, res) => {
        let progress = null;
        if (req.user) {
            // Fetch progress data for logged-in users
            progress = await Progress.getUserData(req.user.id);
        }
        
        res.render('courses.pug', {
            courses: COURSES,
            getCourse: getCourse,
            user: req.user,
            progress: progress,
            locale: res.locals.locale || {id: 'en'},
            theme: req.cookies.theme || 'dark',
            cacheBust: (path: string) => path + '?v=' + Date.now()
        });
    })
    
    // About page - redirect to dashboard if logged in
    .get('/about', (req, res) => {
        if (req.user) return res.redirect('/dashboard');
        res.render('about.pug', {
            user: req.user,
            theme: req.cookies.theme || 'dark',
            cacheBust: (path: string) => path + '?v=' + Date.now()
        });
    })
    
    // AI Chat Management Endpoints
    .post('/api/chat/new', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }
        
        try {
            const {courseId} = req.body;
            if (!courseId) {
                return res.status(400).json({error: 'Course ID required'});
            }
            
            const sessionId = await aiService.createNewChat(req.user.id, courseId);
            res.json({sessionId});
        } catch (error) {
            console.error('New chat error:', error);
            res.status(500).json({error: 'Failed to create new chat'});
        }
    })
    
    .get('/api/chat/history/:courseId', async (req, res) => {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }
        
        try {
            const {courseId} = req.params;
            const history = await aiService.getChatHistory(req.user.id, courseId);
            res.json({history});
        } catch (error) {
            console.error('Chat history error:', error);
            res.status(500).json({error: 'Failed to get chat history'});
        }
    })
    
    .get('/api/chat/sessions', async (req: any, res: any) => {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }
        
        try {
            const sessions = await aiService.getUserChatSessions(req.user.id);
            res.json({sessions: sessions.map(s => s.toJSON())});
        } catch (error) {
            console.error('Get sessions error:', error);
            res.status(500).json({error: 'Failed to get chat sessions'});
        }
    });

    // Dashboard tutor endpoint
    studioApp.getApp().post('/api/tutor/dashboard', async (req: any, res: any) => {
        try {
            const query = req.body.query;
            if (!query) {
                return res.status(400).json({error: 'Please provide a question.'});
            }

            // Create a mock course object for dashboard
            const dashboardCourse = {
                id: 'dashboard',
                title: 'Dashboard Learning Guide',
                description: 'Your personal AI learning guide for all courses',
                color: '#667eea',
                nextCourse: '',
                prevCourse: '',
                locale: 'en',
                availableLocales: ['en'],
                sections: [],
                steps: {},
                goals: 0,
                biosJSON: '{}',
                glossJSON: '{}',
                hintsJSON: '{}'
            };

            const progress = await Progress.lookup(req, 'dashboard');
            const responses = await aiService.generateResponse(query, req.user, dashboardCourse, progress);
            
            res.json(responses);
        } catch (error) {
            console.error('Dashboard Tutor API Error:', error);
            res.status(500).json({error: 'Sorry, I encountered an error. Please try again.'});
        }
    });
    
    studioApp.course({
        askTutor: async (req: any, course: any) => {
            try {
                const query = req.body.query;
                if (!query) {
                    return {status: 400, data: [{content: 'Please provide a question.', kind: 'hint'}]};
                }

                const progress = await Progress.lookup(req, course.id);
                const responses = await aiService.generateResponse(query, req.user, course, progress);
                
                return {status: 200, data: responses};
            } catch (error) {
                console.error('Tutor API Error:', error);
                return {status: 500, data: [{content: 'Sorry, I encountered an error. Please try again.', kind: 'hint', class: 'error'}]};
            }
        }
    });

// Create HTTP server and setup WebSocket
const httpServer = createServer(studioApp.getApp());
const io = setupWebSocket(httpServer);

// Add additional API endpoints using Express app directly
const app = studioApp.getApp();
app.delete('/api/chat/:courseId', async (req: any, res: any) => {
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required'});
    }
    
    try {
        const {courseId} = req.params;
        const success = await aiService.deleteChat(req.user.id, courseId);
        res.json({success});
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({error: 'Failed to delete chat'});
    }
});

// Learning recommendations endpoint
app.get('/api/mentor/recommendations/:courseId', async (req: any, res: any) => {
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required'});
    }
    
    try {
        const {courseId} = req.params;
        const course = getCourse(courseId, 'en');
        if (!course) {
            return res.status(404).json({error: 'Course not found'});
        }
        
        const progress = await Progress.lookup(req, courseId);
        const recommendations = await aiService.getLearningRecommendations(req.user, course, progress);
        res.json({recommendations});
    } catch (error) {
        console.error('Learning recommendations error:', error);
        res.status(500).json({error: 'Failed to get learning recommendations'});
    }
});

// Learning analysis endpoint
app.get('/api/mentor/analysis/:courseId', async (req: any, res: any) => {
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required'});
    }
    
    try {
        const {courseId} = req.params;
        const course = getCourse(courseId, 'en');
        if (!course) {
            return res.status(404).json({error: 'Course not found'});
        }
        
        const progress = await Progress.lookup(req, courseId);
        const analysis = await aiService.analyzeLearningPatterns(req.user, course, progress);
        res.json({analysis});
    } catch (error) {
        console.error('Learning analysis error:', error);
        res.status(500).json({error: 'Failed to analyze learning patterns'});
    }
});

// Store io instance in app for use in routes
studioApp.getApp().set('io', io);

// Add error handlers
studioApp.errors();

// Start the server with WebSocket support
const port = (+process.env.PORT!) || 5000;
httpServer.listen(port, () => {
    console.log(`Running on port ${port} with WebSocket support.`);
});
