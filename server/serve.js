#!/usr/bin/env -S ts-node --script-mode
"use strict";
// Kha-Boom! Development Server
// Enhanced with modern UI/UX
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables from .env file
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const http_1 = require("http");
const app_1 = require("./app");
const utilities_1 = require("./utilities/utilities");
const websocket_1 = require("./websocket");
const progress_1 = require("./models/progress");
const ai_service_1 = require("./services/ai-service");
const studioApp = new app_1.MathigonStudioApp()
    .secure()
    .setup({ sessionSecret: process.env.SESSION_SECRET || 'khaboom-secret-2024' })
    .accounts() // Enable accounts system
    // Health check endpoint for deployment platforms
    .get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
})
    // Landing page (new home) - redirect to dashboard if logged in
    .get('/', (req, res) => {
    if (req.user)
        return res.redirect('/dashboard');
    res.render('landing.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark'
    });
})
    // Courses page - show progress for logged-in users
    .get('/courses', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let progress = null;
    if (req.user) {
        // Fetch progress data for logged-in users
        progress = yield progress_1.Progress.getUserData(req.user.id);
    }
    res.render('courses.pug', {
        courses: utilities_1.COURSES,
        getCourse: utilities_1.getCourse,
        user: req.user,
        progress: progress,
        locale: res.locals.locale || { id: 'en' },
        theme: req.cookies.theme || 'dark',
        cacheBust: (path) => path + '?v=' + Date.now()
    });
}))
    // About page - redirect to dashboard if logged in
    .get('/about', (req, res) => {
    if (req.user)
        return res.redirect('/dashboard');
    res.render('about.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark',
        cacheBust: (path) => path + '?v=' + Date.now()
    });
})
    // Privacy Policy page
    .get('/privacy', (req, res) => {
    res.render('privacy.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark'
    });
})
    // Terms of Service page  
    .get('/terms', (req, res) => {
    res.render('terms.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark'
    });
})
    // AI Chat Management Endpoints
    .post('/api/chat/new', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { courseId } = req.body;
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID required' });
        }
        const sessionId = yield ai_service_1.aiService.createNewChat(req.user.id, courseId);
        res.json({ sessionId });
    }
    catch (error) {
        console.error('New chat error:', error);
        res.status(500).json({ error: 'Failed to create new chat' });
    }
}))
    .get('/api/chat/history/:courseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { courseId } = req.params;
        const history = yield ai_service_1.aiService.getChatHistory(req.user.id, courseId);
        res.json({ history });
    }
    catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ error: 'Failed to get chat history' });
    }
}))
    .get('/api/chat/sessions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const sessions = yield ai_service_1.aiService.getUserChatSessions(req.user.id);
        res.json({ sessions: sessions.map(s => s.toJSON()) });
    }
    catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to get chat sessions' });
    }
}))
    .post('/api/chat/summarize/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { sessionId } = req.params;
        const success = yield ai_service_1.aiService.manualSummarizeSession(req.user.id, sessionId);
        res.json({ success, message: success ? 'Session summarized successfully' : 'No summarization needed' });
    }
    catch (error) {
        console.error('Manual summarization error:', error);
        res.status(500).json({ error: 'Failed to summarize session' });
    }
}));
// Dashboard tutor endpoint
studioApp.getApp().post('/api/tutor/dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.body.query;
        if (!query) {
            return res.status(400).json({ error: 'Please provide a question.' });
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
        const progress = yield progress_1.Progress.lookup(req, 'dashboard');
        const responses = yield ai_service_1.aiService.generateResponse(query, req.user, dashboardCourse, progress);
        res.json(responses);
    }
    catch (error) {
        console.error('Dashboard Tutor API Error:', error);
        res.status(500).json({ error: 'Sorry, I encountered an error. Please try again.' });
    }
}));
studioApp.course({
    askTutor: (req, course) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const query = req.body.query;
            if (!query) {
                return { status: 400, data: [{ content: 'Please provide a question.', kind: 'hint' }] };
            }
            const progress = yield progress_1.Progress.lookup(req, course.id);
            const responses = yield ai_service_1.aiService.generateResponse(query, req.user, course, progress);
            return { status: 200, data: responses };
        }
        catch (error) {
            console.error('Tutor API Error:', error);
            return { status: 500, data: [{ content: 'Sorry, I encountered an error. Please try again.', kind: 'hint', class: 'error' }] };
        }
    })
});
// Create HTTP server and setup WebSocket
const httpServer = (0, http_1.createServer)(studioApp.getApp());
const io = (0, websocket_1.setupWebSocket)(httpServer);
// Add additional API endpoints using Express app directly
const app = studioApp.getApp();
app.delete('/api/chat/:courseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { courseId } = req.params;
        const success = yield ai_service_1.aiService.deleteChat(req.user.id, courseId);
        res.json({ success });
    }
    catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
}));
// Learning recommendations endpoint
app.get('/api/mentor/recommendations/:courseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { courseId } = req.params;
        const course = (0, utilities_1.getCourse)(courseId, 'en');
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const progress = yield progress_1.Progress.lookup(req, courseId);
        const recommendations = yield ai_service_1.aiService.getLearningRecommendations(req.user, course, progress);
        res.json({ recommendations });
    }
    catch (error) {
        console.error('Learning recommendations error:', error);
        res.status(500).json({ error: 'Failed to get learning recommendations' });
    }
}));
// Learning analysis endpoint
app.get('/api/mentor/analysis/:courseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const { courseId } = req.params;
        const course = (0, utilities_1.getCourse)(courseId, 'en');
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const progress = yield progress_1.Progress.lookup(req, courseId);
        const analysis = yield ai_service_1.aiService.analyzeLearningPatterns(req.user, course, progress);
        res.json({ analysis });
    }
    catch (error) {
        console.error('Learning analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze learning patterns' });
    }
}));
// Store io instance in app for use in routes
studioApp.getApp().set('io', io);
// Add error handlers
studioApp.errors();
// Start the server with WebSocket support
const port = (+process.env.PORT) || 5000;
httpServer.listen(port, () => {
    console.log(`Running on port ${port} with WebSocket support.`);
});
