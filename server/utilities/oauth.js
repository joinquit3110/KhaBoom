"use strict";
// =============================================================================
// OAuth API
// (c) Kha-Boom!
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAUTHPROVIDERS = void 0;
exports.oAuthLogin = oAuthLogin;
exports.oAuthCallback = oAuthCallback;
const url_1 = require("url");
const node_fetch_1 = __importDefault(require("node-fetch"));
const progress_1 = require("../models/progress");
const user_1 = require("../models/user");
const emails_1 = require("./emails");
const utilities_1 = require("./utilities");
const validate_1 = require("./validate");
// Copy client secrets from secrets.yaml to oauth.yaml data file.
const PROVIDERS = (0, utilities_1.loadData)('oauth');
for (const id of Object.keys(PROVIDERS)) {
    PROVIDERS[id].id = id;
    if ((_a = utilities_1.CONFIG.accounts.oAuth) === null || _a === void 0 ? void 0 : _a[id])
        Object.assign(PROVIDERS[id], (_b = utilities_1.CONFIG.accounts.oAuth) === null || _b === void 0 ? void 0 : _b[id]);
}
// Export list of providers for PUG templates
exports.OAUTHPROVIDERS = Object.keys(utilities_1.CONFIG.accounts.oAuth || {}).map(p => PROVIDERS[p]);
// -----------------------------------------------------------------------------
// User Creation and Lookup
function normalizeProfile(data, provider) {
    if (!data)
        return;
    const profile = { id: '', email: '' };
    const config = PROVIDERS[provider];
    for (const key of ['id', 'email', 'firstName', 'lastName', 'picture']) {
        const template = config.profile[key] || '';
        profile[key] = template.replace(/\${([^}]+)}/g, (_, key) => key.split('||').map(k => data[k.trim()]).find(t => t) || '');
    }
    profile.email = (0, validate_1.normalizeEmail)(profile.email) || '';
    return (profile.email && profile.id) ? profile : undefined;
}
async function findOrCreateUser(req, provider, profile) {
    const token = `${provider}:${profile.id}`;
    const p1 = user_1.User.findOne({ oAuthTokens: token });
    const p2 = user_1.User.lookup(profile.email);
    const [sameProviderUser, sameEmailUser] = await Promise.all([p1, p2]);
    if (sameProviderUser) {
        // If the user has two accounts and they switched their provider email
        // address from one to the other, we have to disable one of their accounts
        // to ensure the `email` key is unique.
        if (sameEmailUser && sameEmailUser.id !== sameProviderUser.id) {
            sameEmailUser.email += '__duplicate';
            sameEmailUser.deletionRequested = Date.now();
            await sameEmailUser.save();
        }
        sameProviderUser.email = profile.email;
        await sameProviderUser.save();
        return sameProviderUser;
    }
    if (sameEmailUser && !sameEmailUser.emailVerificationToken) {
        // Link this OAuth provider to an existing account.
        sameEmailUser.oAuthTokens.push(token);
        // TODO req.flash('info', req.__(MESSAGES['socialLoginLink'], toTitleCase(provider)));
        await sameEmailUser.save();
        return sameEmailUser;
    }
    if (sameEmailUser) {
        // If there already is an account with the same email address, but the
        // email address has not been verified, we have to remove it.
        sameEmailUser.email += '__removed';
        sameEmailUser.deletionRequested = Date.now();
        await sameEmailUser.save();
    }
    const user = new user_1.User({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        picture: profile.picture,
        type: 'student',
        country: req.country,
        oAuthTokens: [token]
    });
    await user.save();
    // Copy course data from temporary user to new user account.
    if (req.tmpUser)
        await progress_1.Progress.updateMany({ userId: req.tmpUser }, { userId: user.id }).exec();
    (0, emails_1.sendWelcomeEmail)(user); // async
    return user;
}
// -----------------------------------------------------------------------------
// OAuth Flow
// We use req.headers.host rather than req.hostname because we need to include
// the localhost port during local development. Note that the redirect URI
// must exactly match a value set up with the third-party oAuth provider.
const host = (req) => `${req.protocol}://${req.headers.host}`;
function login(req, provider) {
    const config = PROVIDERS[provider];
    const query = new url_1.URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: `${host(req)}/auth/${provider}/callback`,
        scope: config.scope || ''
    });
    return `${config.authorizeUrl}?${query.toString()}`;
}
async function getToken(req, provider) {
    var _a;
    const config = PROVIDERS[provider];
    const body = new url_1.URLSearchParams({
        grant_type: 'authorization_code',
        code: (0, utilities_1.q)(req, 'code'),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${host(req)}/auth/${provider}/callback`
    });
    const response = await (0, node_fetch_1.default)(config.accessUrl, { method: 'POST', body });
    if (!response.ok)
        return;
    return (_a = (await response.json())) === null || _a === void 0 ? void 0 : _a.access_token;
}
async function getProfile(req, provider, accessToken) {
    const config = PROVIDERS[provider];
    if (!accessToken)
        accessToken = await getToken(req, provider);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const response = await (0, node_fetch_1.default)(config.profileUrl, { method: config.profileMethod, headers });
    if (!response.ok)
        return;
    return normalizeProfile(await response.json(), provider);
}
// -----------------------------------------------------------------------------
// Server Endpoints
async function oAuthLogin(req) {
    var _a;
    if (!((_a = utilities_1.CONFIG.accounts.oAuth) === null || _a === void 0 ? void 0 : _a[req.params.provider]))
        return;
    const provider = req.params.provider;
    const redirect = login(req, provider);
    return redirect ? { redirect } : { error: 'socialLoginError', params: [PROVIDERS[provider].title] };
}
async function oAuthCallback(req) {
    var _a;
    if (!((_a = utilities_1.CONFIG.accounts.oAuth) === null || _a === void 0 ? void 0 : _a[req.params.provider]))
        return;
    const provider = req.params.provider;
    const profile = await getProfile(req, provider);
    const user = profile ? await findOrCreateUser(req, provider, profile) : undefined;
    return user ? { user } : { error: 'socialLoginError', params: [PROVIDERS[provider].title] };
}
