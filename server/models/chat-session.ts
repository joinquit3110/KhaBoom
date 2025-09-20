// =============================================================================
// Chat Session Model
// (c) Kha-Boom!
// =============================================================================

import {Document, Model, model, Schema, Types} from 'mongoose';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSessionBase {
  userId: string;
  courseId: string;
  sessionId: string;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionDocument extends ChatSessionBase, Document {
  _id: Types.ObjectId;
  
  // Methods
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  getRecentMessages: (limit?: number) => ChatMessage[];
  needsSummarization: () => boolean;
  summarizeOldMessages: (summary: string) => void;
  toJSON: () => any;
}

interface ChatSessionModel extends Model<ChatSessionDocument> {
  findByUser: (userId: string) => Promise<ChatSessionDocument[]>;
  findByUserAndCourse: (userId: string, courseId: string) => Promise<ChatSessionDocument[]>;
  getActiveSession: (userId: string, courseId: string) => Promise<ChatSessionDocument | null>;
  createNewSession: (userId: string, courseId: string) => Promise<ChatSessionDocument>;
}

const ChatMessageSchema = new Schema({
  role: {type: String, enum: ['system', 'user', 'assistant'], required: true},
  content: {type: String, required: true},
  timestamp: {type: Date, default: Date.now}
}, {_id: false});

const ChatSessionSchema = new Schema<ChatSessionDocument, ChatSessionModel>({
  userId: {type: String, required: true, index: true},
  courseId: {type: String, required: true, index: true},
  sessionId: {type: String, required: true, unique: true},
  messages: [ChatMessageSchema],
  isActive: {type: Boolean, default: true}
}, {timestamps: true});

ChatSessionSchema.index({userId: 1, courseId: 1, isActive: 1});

ChatSessionSchema.methods.addMessage = function(role: 'user' | 'assistant', content: string) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  this.updatedAt = new Date();
};

ChatSessionSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages
    .filter((msg: ChatMessage) => msg.role !== 'system')
    .slice(-limit);
};

ChatSessionSchema.methods.needsSummarization = function() {
  const nonSystemMessages = this.messages.filter((msg: ChatMessage) => msg.role !== 'system');
  return nonSystemMessages.length > 10;
};

ChatSessionSchema.methods.summarizeOldMessages = function(summary: string) {
  const nonSystemMessages = this.messages.filter((msg: ChatMessage) => msg.role !== 'system');
  const systemMessages = this.messages.filter((msg: ChatMessage) => msg.role === 'system');
  
  if (nonSystemMessages.length > 10) {
    // Keep the last 3 messages for context
    const messagesToKeep = nonSystemMessages.slice(-3);
    
    // Add summary as a system message
    const summaryMessage: ChatMessage = {
      role: 'system',
      content: `[CONVERSATION SUMMARY] ${summary}`,
      timestamp: new Date()
    };
    
    // Reconstruct messages array with summary + kept messages
    this.messages = [summaryMessage, ...messagesToKeep];
    this.updatedAt = new Date();
  }
};

ChatSessionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return {
    id: obj._id,
    sessionId: obj.sessionId,
    courseId: obj.courseId,
    messages: obj.messages.filter((msg: ChatMessage) => msg.role !== 'system'),
    isActive: obj.isActive,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

ChatSessionSchema.statics.findByUser = async function(userId: string) {
  return this.find({userId, isActive: true})
    .sort({updatedAt: -1})
    .exec();
};

ChatSessionSchema.statics.findByUserAndCourse = async function(userId: string, courseId: string) {
  return this.find({userId, courseId, isActive: true})
    .sort({updatedAt: -1})
    .exec();
};

ChatSessionSchema.statics.getActiveSession = async function(userId: string, courseId: string) {
  return this.findOne({userId, courseId, isActive: true})
    .sort({updatedAt: -1})
    .exec();
};

ChatSessionSchema.statics.createNewSession = async function(userId: string, courseId: string) {
  // Deactivate existing sessions for this user/course
  await this.updateMany(
    {userId, courseId, isActive: true},
    {isActive: false}
  );
  
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
};

export const ChatSession = model<ChatSessionDocument, ChatSessionModel>('ChatSession', ChatSessionSchema);
