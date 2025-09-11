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
    
    
    .course({});

// Create HTTP server and setup WebSocket
const httpServer = createServer(studioApp.getApp());
const io = setupWebSocket(httpServer);

// Store io instance in app for use in routes
studioApp.getApp().set('io', io);

// Add error handlers
studioApp.errors();

// Start the server with WebSocket support
const port = (+process.env.PORT!) || 5000;
httpServer.listen(port, () => {
    console.log(`Running on port ${port} with WebSocket support.`);
});
