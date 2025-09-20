"use strict";
// =============================================================================
// Chat Session Model
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
exports.ChatSession = void 0;
const mongoose_1 = require("mongoose");
const ChatMessageSchema = new mongoose_1.Schema({
    role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });
const ChatSessionSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, unique: true },
    messages: [ChatMessageSchema],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
ChatSessionSchema.index({ userId: 1, courseId: 1, isActive: 1 });
ChatSessionSchema.methods.addMessage = function (role, content) {
    this.messages.push({
        role,
        content,
        timestamp: new Date()
    });
    this.updatedAt = new Date();
};
ChatSessionSchema.methods.getRecentMessages = function (limit = 10) {
    return this.messages
        .filter((msg) => msg.role !== 'system')
        .slice(-limit);
};
ChatSessionSchema.methods.needsSummarization = function () {
    const nonSystemMessages = this.messages.filter((msg) => msg.role !== 'system');
    return nonSystemMessages.length > 10;
};
ChatSessionSchema.methods.summarizeOldMessages = function (summary) {
    const nonSystemMessages = this.messages.filter((msg) => msg.role !== 'system');
    const systemMessages = this.messages.filter((msg) => msg.role === 'system');
    if (nonSystemMessages.length > 10) {
        // Keep the last 3 messages for context
        const messagesToKeep = nonSystemMessages.slice(-3);
        // Add summary as a system message
        const summaryMessage = {
            role: 'system',
            content: `[CONVERSATION SUMMARY] ${summary}`,
            timestamp: new Date()
        };
        // Reconstruct messages array with summary + kept messages
        this.messages = [summaryMessage, ...messagesToKeep];
        this.updatedAt = new Date();
    }
};
ChatSessionSchema.methods.toJSON = function () {
    const obj = this.toObject();
    return {
        id: obj._id,
        sessionId: obj.sessionId,
        courseId: obj.courseId,
        messages: obj.messages.filter((msg) => msg.role !== 'system'),
        isActive: obj.isActive,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt
    };
};
ChatSessionSchema.statics.findByUser = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ userId, isActive: true })
            .sort({ updatedAt: -1 })
            .exec();
    });
};
ChatSessionSchema.statics.findByUserAndCourse = function (userId, courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ userId, courseId, isActive: true })
            .sort({ updatedAt: -1 })
            .exec();
    });
};
ChatSessionSchema.statics.getActiveSession = function (userId, courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.findOne({ userId, courseId, isActive: true })
            .sort({ updatedAt: -1 })
            .exec();
    });
};
ChatSessionSchema.statics.createNewSession = function (userId, courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Deactivate existing sessions for this user/course
        yield this.updateMany({ userId, courseId, isActive: true }, { isActive: false });
        // Create new session
        const sessionId = `${userId}-${courseId}-${Date.now()}`;
        const session = new this({
            userId,
            courseId,
            sessionId,
            messages: [],
            isActive: true
        });
        return session.save();
    });
};
exports.ChatSession = (0, mongoose_1.model)('ChatSession', ChatSessionSchema);
