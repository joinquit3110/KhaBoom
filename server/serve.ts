#!/usr/bin/env -S ts-node --script-mode

// Kha-Boom! Development Server
// Enhanced with modern UI/UX

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

import {MathigonStudioApp} from './app';
import {COURSES, getCourse} from './utilities/utilities';

new MathigonStudioApp()
    .secure()
    .setup({sessionSecret: 'khaboom-secret-2024'})
    .accounts()  // Enable accounts system
    
    // Landing page (new home)
    .get('/', (req, res) => res.render('landing.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark'
    }))
    
    // Courses page (formerly home)
    .get('/courses', (req, res) => res.render('courses.pug', {
        courses: COURSES,
        getCourse: getCourse,
        user: req.user,
        locale: res.locals.locale || {id: 'en'},
        theme: req.cookies.theme || 'dark',
        cacheBust: (path: string) => path + '?v=' + Date.now()
    }))
    
    // About page
    .get('/about', (req, res) => res.render('about.pug', {
        user: req.user,
        theme: req.cookies.theme || 'dark',
        cacheBust: (path: string) => path + '?v=' + Date.now()
    }))
    
    .course({})
    .errors()
    .listen(5000);
