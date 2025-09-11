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
const studioApp = new app_1.MathigonStudioApp()
    .secure()
    .setup({ sessionSecret: 'khaboom-secret-2024' })
    .accounts() // Enable accounts system
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
    .course({});
// Create HTTP server and setup WebSocket
const httpServer = (0, http_1.createServer)(studioApp.getApp());
const io = (0, websocket_1.setupWebSocket)(httpServer);
// Store io instance in app for use in routes
studioApp.getApp().set('io', io);
// Add error handlers
studioApp.errors();
// Start the server with WebSocket support
const port = (+process.env.PORT) || 5000;
httpServer.listen(port, () => {
    console.log(`Running on port ${port} with WebSocket support.`);
});
