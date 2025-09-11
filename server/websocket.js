"use strict";
// =============================================================================
// WebSocket Server for Real-time Updates
// (c) Kha-Boom!
// =============================================================================
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
exports.setupWebSocket = setupWebSocket;
const socket_io_1 = require("socket.io");
const user_1 = require("./models/user");
function setupWebSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:8080'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });
    // Authentication middleware
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                // Verify token and get user
                const user = yield user_1.User.findById(token);
                if (user) {
                    socket.data.userId = user.id;
                    socket.data.username = user.fullName;
                }
            }
            catch (error) {
                console.error('Socket auth error:', error);
            }
        }
        next();
    }));
    io.on('connection', (socket) => {
        console.log('New WebSocket connection:', socket.id);
        // Join user to their personal room for notifications
        const userId = socket.data.userId;
        if (userId) {
            socket.join(`user:${userId}`);
        }
        // Add real-time event handlers here as needed
        // For example: course progress updates, notifications, etc.
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('WebSocket disconnected:', socket.id);
        });
    });
    return io;
}
