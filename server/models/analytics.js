"use strict";
// =============================================================================
// Analytics Model
// (c) Kha-Boom!
// =============================================================================
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
exports.LoginAnalytics = exports.CourseAnalytics = void 0;
const date = __importStar(require("date-fns"));
const mongoose_1 = require("mongoose");
const core_1 = require("@mathigon/core");
const TIMEOUT = 1000 * 60 * 3; // 3 minutes
const TRAILING_TIME = 40; // 40 seconds
const CourseAnalyticsSchema = new mongoose_1.Schema({
    user: { type: String, index: true },
    date: { type: Date, index: true },
    points: { type: Number, default: 0 },
    seconds: { type: Number, default: 0 }, // Time on page, in seconds
    lastTime: { type: Date, default: new Date(0) }
}, { timestamps: true });
CourseAnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });
CourseAnalyticsSchema.statics.track = function (userId_1) {
    return __awaiter(this, arguments, void 0, function* (userId, points = 0) {
        // TODO Ensure requests are always handled in the correct order (index?).
        // TODO Use client timestamps rather than server timestamps.
        const today = new Date(date.format(new Date(), 'yyyy-MM-dd'));
        let analytics = yield exports.CourseAnalytics.findOne({ date: today, user: userId });
        if (!analytics)
            analytics = new exports.CourseAnalytics({ date: today, user: userId });
        const dt = (+today) - (+analytics.lastTime);
        if (dt > 0) {
            analytics.seconds += (dt < TIMEOUT) ? Math.round(dt / 1000) : TRAILING_TIME;
            analytics.lastTime = today;
        }
        analytics.points += points;
        yield analytics.save();
    });
};
CourseAnalyticsSchema.statics.getLastWeekStats = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return exports.CourseAnalytics.getStats(userId, date.subDays(new Date(), 7), new Date());
    });
};
CourseAnalyticsSchema.statics.getStats = function (user, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = yield exports.CourseAnalytics.find({ user, date: { $gte: start, $lte: end } }).exec();
        const points = (0, core_1.total)(items.map(a => a.points));
        const minutes = Math.ceil((0, core_1.total)(items.map(a => a.seconds)) / 60);
        return { points, minutes };
    });
};
CourseAnalyticsSchema.statics.getLeaderboard = function () {
    return __awaiter(this, void 0, void 0, function* () {
        // Import User model here to avoid circular dependency
        const { User } = yield Promise.resolve().then(() => __importStar(require('./user')));
        // Get stats for the last 30 days for all users
        const thirtyDaysAgo = date.subDays(new Date(), 30);
        const pipeline = [
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: '$user',
                    totalPoints: { $sum: '$points' },
                    totalSeconds: { $sum: '$seconds' }
                }
            },
            { $sort: { totalPoints: -1 } },
            { $limit: 10 }
        ];
        const results = yield exports.CourseAnalytics.aggregate(pipeline);
        // Get user details and format the leaderboard
        const leaderboard = [];
        for (const result of results) {
            const user = yield User.findById(result._id);
            if (user) {
                leaderboard.push({
                    name: user.fullName,
                    avatar: user.avatar(56),
                    points: result.totalPoints,
                    minutes: Math.ceil(result.totalSeconds / 60)
                });
            }
        }
        return leaderboard;
    });
};
exports.CourseAnalytics = (0, mongoose_1.model)('CourseAnalytics', CourseAnalyticsSchema);
const LoginAnalyticsSchema = new mongoose_1.Schema({
    user: { type: String, required: true },
    date: { type: Date, required: true }
}, { timestamps: true });
LoginAnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });
LoginAnalyticsSchema.statics.ping = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date(date.format(new Date(), 'yyyy-MM-dd'));
        if (today <= (user.lastOnline || 0))
            return;
        const query = { user: user.id, date: today };
        user.lastOnline = today;
        const p1 = exports.LoginAnalytics.findOneAndUpdate(query, {}, { upsert: true });
        const p2 = user.save();
        yield Promise.all([p1, p2]);
    });
};
exports.LoginAnalytics = (0, mongoose_1.model)('LoginAnalytics', LoginAnalyticsSchema);
