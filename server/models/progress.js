"use strict";
// =============================================================================
// Course Progress Model
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
exports.Progress = void 0;
const xss_1 = require("xss");
const mongoose_1 = require("mongoose");
const core_1 = require("@mathigon/core");
const fermat_1 = require("@mathigon/fermat");
const utilities_1 = require("../utilities/utilities");
const whiteList = { a: ['href'], strong: [], b: [], em: [], i: [], u: [] };
const sanitise = new xss_1.FilterXSS({ whiteList });
// -----------------------------------------------------------------------------
// Schema
const ProgressSchema = new mongoose_1.Schema({
    userId: { type: String, index: true, required: true },
    courseId: { type: String, required: true },
    progress: { type: Number, default: 0 }, // Percentage between 0 and 100
    sections: {
        type: Map,
        of: {
            progress: { type: Number, default: 0 }, // Percentage between 0 and 100
            completed: { type: Boolean, default: false },
            activeStep: String
        },
        default: {}
    },
    steps: {
        type: Map,
        of: { scores: [String], data: String },
        default: {}
    },
    messages: [{ content: String, kind: { type: String, default: 'hint' } }]
}, { timestamps: true });
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
ProgressSchema.virtual('activeSection').get(function () {
    const course = (0, utilities_1.getCourse)(this.courseId, 'en');
    const status = course.sections.map((section) => {
        var _a, _b;
        const progress = (_a = this.sections.get(section.id)) === null || _a === void 0 ? void 0 : _a.progress;
        if (!progress)
            return 'empty';
        if (((_b = this.sections.get(section.id)) === null || _b === void 0 ? void 0 : _b.completed) && progress > 90)
            return 'completed';
        return 'started';
    });
    // Last section that has been attempted but not completed.
    const lastStarted = status.lastIndexOf('started');
    // Last section that is not completed, but directly after a completed one.
    const lastAfterCompleted = (0, utilities_1.findLastIndex)(status, (s, i) => (s !== 'completed' && status[i - 1] === 'completed'));
    const p = Math.max(0, lastStarted, lastAfterCompleted);
    return course.sections[p];
});
ProgressSchema.methods.getSectionData = function (sectionId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const steps = {};
        // TODO Only return data for steps in the requested section.
        for (const [key, step] of ((_a = this.steps) === null || _a === void 0 ? void 0 : _a.entries()) || []) {
            steps[key] = { scores: step.scores, data: step.data ? JSON.parse(step.data) : undefined };
        }
        const section = sectionId ? (_b = this.sections) === null || _b === void 0 ? void 0 : _b.get(sectionId) : undefined;
        const messages = (_c = this.messages) === null || _c === void 0 ? void 0 : _c.map(m => ({ content: m.content, type: m.kind }));
        return { completed: section === null || section === void 0 ? void 0 : section.completed, activeStep: section === null || section === void 0 ? void 0 : section.activeStep, messages, steps };
    });
};
ProgressSchema.methods.getSectionProgress = function (section) {
    var _a, _b;
    return (((_b = (_a = this.sections) === null || _a === void 0 ? void 0 : _a.get(section.id)) === null || _b === void 0 ? void 0 : _b.progress) || 0) / 100;
};
ProgressSchema.methods.updateData = function (sectionId, changes) {
    var _a;
    const course = (0, utilities_1.getCourse)(this.courseId);
    const sectionData = ((_a = this.sections) === null || _a === void 0 ? void 0 : _a.get(sectionId)) || {};
    let addedScores = 0; // Keep track of how many new scores were added
    if ('activeStep' in changes)
        sectionData.activeStep = changes.activeStep;
    if ('completed' in changes)
        sectionData.completed = changes.completed;
    for (const [stepId, { scores, data }] of Object.entries(changes.steps || [])) {
        const step = course.steps[stepId];
        if (!step)
            continue;
        const stepData = this.steps.get(stepId) || { scores: [] };
        if (scores) {
            const previousScores = stepData.scores.length;
            stepData.scores = step.goals.filter(id => stepData.scores.includes(id) || scores.includes(id));
            addedScores += stepData.scores.length - previousScores;
        }
        if (data) {
            // TODO Sanitize other data fields. Better validation?
            if (data['free-text'])
                data['free-text'] = sanitise.process(data['free-text'].slice(0, 500).trim());
            const newData = Object.assign((0, core_1.safeToJSON)(stepData.data, {}), data);
            stepData.data = JSON.stringify(newData);
        }
        this.steps.set(stepId, stepData); // Update Mongoose map
    }
    const section = course.sections.find(s => s.id === sectionId);
    const sectionGoals = (0, core_1.total)(section.steps.map(s => { var _a; return ((_a = this.steps.get(s)) === null || _a === void 0 ? void 0 : _a.scores.length) || 0; }));
    sectionData.progress = (0, fermat_1.clamp)(Math.round(sectionGoals / section.goals * 100) || 0, 0, 100);
    const courseGoals = (0, core_1.total)(course.sections.map(s => { var _a; return ((_a = this.sections.get(s.id)) === null || _a === void 0 ? void 0 : _a.progress) || 0; }));
    this.progress = (0, fermat_1.clamp)(Math.round(courseGoals / course.goals * 100) || 0, 0, 100);
    this.sections.set(sectionId, sectionData); // Update Mongoose map
    return addedScores;
};
ProgressSchema.methods.getJSON = function (sectionId) {
    var _a;
    // TODO Only return data for steps in the requested section.
    const steps = {};
    for (const [key, data] of this.steps.entries()) {
        steps[key] = { scores: data.scores, data: data.data ? JSON.parse(data.data) : undefined };
    }
    const section = sectionId ? this.sections.get(sectionId) : undefined;
    return JSON.stringify({
        completed: section ? section.completed : undefined,
        activeStep: section ? section.activeStep : undefined,
        messages: (_a = this.messages) === null || _a === void 0 ? void 0 : _a.map(m => ({ content: m.content, kind: m.kind })),
        steps
    });
};
ProgressSchema.statics.lookup = function (req_1, courseId_1) {
    return __awaiter(this, arguments, void 0, function* (req, courseId, createNew = false) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.tmpUser || '';
        if (!userId)
            return undefined;
        const progress = yield exports.Progress.findOne({ userId, courseId }).exec();
        return createNew ? progress || new exports.Progress({ userId, courseId }) : progress;
    });
};
ProgressSchema.statics.delete = function (req, courseId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.tmpUser || '';
        const response = yield exports.Progress.deleteOne({ userId, courseId }).exec();
        return response.deletedCount >= 0;
    });
};
ProgressSchema.statics.getUserData = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = new Map();
        const courses = yield exports.Progress.find({ userId }, '-steps -messages').exec();
        for (const c of courses)
            data.set(c.courseId, c);
        return data;
    });
};
/** Returns all course IDs which a student has attempted, in order of recency. */
ProgressSchema.statics.getRecentCourses = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const courses = Array.from((yield exports.Progress.getUserData(userId)).values());
        return courses
            .filter(data => data.progress >= 0) // Include all courses with any progress record, even 0%
            .sort((p, q) => (+q.updatedAt) - (+p.updatedAt))
            .map(p => p.courseId);
    });
};
// -----------------------------------------------------------------------------
exports.Progress = (0, mongoose_1.model)('Progress', ProgressSchema);
