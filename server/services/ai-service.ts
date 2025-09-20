// =============================================================================
// AI Service - Groq Integration
// (c) Kha-Boom!
// =============================================================================

import Groq from 'groq-sdk';
import {readFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';
import {Course, Section} from '../interfaces';
import {getCourse} from '../utilities/utilities';
import {UserDocument} from '../models/user';
import {ProgressDocument} from '../models/progress';
import {ChatSession, ChatSessionDocument} from '../models/chat-session';
import {search} from '../search';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Remove the local ChatSession interface since we're using the database model

interface AIResponse {
  content: string;
  kind: 'hint' | 'question' | 'img' | 'video';
  class?: string;
}

export class AIService {
  private groq: Groq;
  private courseKnowledge: Map<string, string> = new Map();

  constructor() {
    this.groq = new Groq({
      apiKey: ''
    });
    this.loadCourseKnowledge();
  }

  // Load course content into knowledge base
  private loadCourseKnowledge(): void {
    const contentDir = join(process.cwd(), 'content');
    
    try {
      const courses = readdirSync(contentDir);
      
      for (const courseId of courses) {
        const coursePath = join(contentDir, courseId);
        if (!statSync(coursePath).isDirectory()) continue;
        
        let courseContent = '';
        
        // Read main content file
        const contentFile = join(coursePath, 'content.md');
        try {
          courseContent += readFileSync(contentFile, 'utf-8');
        } catch (e) {
          console.warn(`Could not read content.md for course ${courseId}`);
        }
        
        // Read hints file
        const hintsFile = join(coursePath, 'hints.yaml');
        try {
          courseContent += '\n\nHints:\n' + readFileSync(hintsFile, 'utf-8');
        } catch (e) {
          console.warn(`Could not read hints.yaml for course ${courseId}`);
        }
        
        // Read functions file
        const functionsFile = join(coursePath, 'functions.ts');
        try {
          courseContent += '\n\nFunctions:\n' + readFileSync(functionsFile, 'utf-8');
        } catch (e) {
          console.warn(`Could not read functions.ts for course ${courseId}`);
        }
        
        this.courseKnowledge.set(courseId, courseContent);
        console.log(`Loaded knowledge for course: ${courseId}`);
      }
      
      // Add dashboard knowledge
      const dashboardContent = `
        Dashboard Learning Guide:
        This is the user dashboard where students can access their learning progress, statistics, and interact with the AI learning guide.
        
        Available Courses:
        - Circles and Pi: Intermediate mathematics focusing on circular geometry, radians, and the mathematical constant π
        - Divisibility and Primes: Foundations of number theory including factors, multiples, prime numbers, and divisibility rules
        - Polygons: Intermediate geometry covering polygons, quadrilaterals, and tessellations
        - Probability: Intermediate probability theory including conditional probability, probability trees, and famous problems
        - Quadratic Equations: Intermediate algebra focusing on solving quadratic equations and the quadratic formula
        
        Learning Features:
        - Progress tracking across all courses
        - Weekly statistics and learning analytics
        - Leaderboard for motivation
        - AI-powered learning recommendations
        - Personalized study guidance
        
        The AI learning guide can help students understand their progress, recommend next steps, and provide guidance on any course content.
      `;
      this.courseKnowledge.set('dashboard', dashboardContent);
      console.log(`Loaded knowledge for course: dashboard`);
      
    } catch (error) {
      console.error('Error loading course knowledge:', error);
    }
  }

  // Get or create chat session from database
  private async getChatSession(userId: string, courseId: string): Promise<ChatSessionDocument | null> {
    try {
      let session = await ChatSession.getActiveSession(userId, courseId);
      
      if (!session) {
        session = await ChatSession.createNewSession(userId, courseId);
      }
      
      return session;
    } catch (error) {
      console.warn('Database not available, using in-memory session:', error);
      return null;
    }
  }

  // Create new chat session
  public async createNewChat(userId: string, courseId: string): Promise<string> {
    try {
      const session = await ChatSession.createNewSession(userId, courseId);
      return session.sessionId;
    } catch (error) {
      console.warn('Database not available, using in-memory session:', error);
      return `temp-${Date.now()}`;
    }
  }

  // Get chat history
  public async getChatHistory(userId: string, courseId: string): Promise<ChatMessage[]> {
    try {
      const session = await ChatSession.getActiveSession(userId, courseId);
      return session ? session.getRecentMessages() : [];
    } catch (error) {
      console.warn('Database not available, returning empty history:', error);
      return [];
    }
  }

  // Delete chat session
  public async deleteChat(userId: string, courseId: string): Promise<boolean> {
    try {
      const result = await ChatSession.updateMany(
        {userId, courseId, isActive: true},
        {isActive: false}
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.warn('Database not available, cannot delete chat:', error);
      return false;
    }
  }

  // Generate AI response
  public async generateResponse(
    query: string,
    user: UserDocument | null,
    course: Course,
    progress?: ProgressDocument
  ): Promise<AIResponse[]> {
    let session = await this.getChatSession(user?.id || 'anonymous', course.id);
    
    // Check if this is the first message in a new session
    const isFirstMessage = !session || session.messages.length === 0;
    
    // If this is the first message and it's dashboard, return welcome message
    if (isFirstMessage && course.id === 'dashboard') {
      const welcomeMessage = `Welcome to Kha-Boom! I'm Stewie, your personal tutor🎓.`;
      
      // Create session if it doesn't exist
      if (!session) {
        const sessionId = await this.createNewChat(user?.id || 'anonymous', course.id);
        session = await this.getChatSession(user?.id || 'anonymous', course.id);
      }
      
      if (session) {
        session.addMessage('assistant', welcomeMessage);
        try {
          await session.save();
        } catch (error) {
          console.warn('Could not save session:', error);
        }
      }
      
      return [{
        content: welcomeMessage,
        kind: 'hint'
      }];
    }
    
    // If this is the first message in a course, return course-specific welcome
    if (isFirstMessage && course.id !== 'dashboard') {
      const welcomeMessage = `Welcome to Kha-Boom! I'm Stewie, your personal tutor🎓.

I'm here to help you with ${course.title}. Our content is divided into small steps. You have to complete the activities to reveal what's next.

Feel free to ask me any questions about the course material!`;
      
      // Create session if it doesn't exist
      if (!session) {
        const sessionId = await this.createNewChat(user?.id || 'anonymous', course.id);
        session = await this.getChatSession(user?.id || 'anonymous', course.id);
      }
      
      if (session) {
        session.addMessage('assistant', welcomeMessage);
        try {
          await session.save();
        } catch (error) {
          console.warn('Could not save session:', error);
        }
      }
      
      return [{
        content: welcomeMessage,
        kind: 'hint'
      }];
    }
    
    // Build system prompt with course knowledge and user context
    const systemPrompt = this.buildSystemPrompt(course, user, progress);
    
    // Prepare messages for Groq API
    const messages: ChatMessage[] = [
      {role: 'system', content: systemPrompt}
    ];
    
    // Add recent conversation history if session is available
    if (session) {
      session.addMessage('user', query);
      messages.push(...session.messages.slice(-6).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
    } else {
      // Fallback: just add the current query
      messages.push({role: 'user', content: query});
    }
    
    try {
      const completion = await this.groq.chat.completions.create({
        messages: messages,
        model: 'llama-3.1-8b-instant', // Updated to current model
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      });
      
      const response = completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at this time.';
      
      // Check if user is asking for specific content or links
      const shouldShowLinks = this.shouldShowSearchLinks(query);
      let enhancedResponse = response;
      
      if (shouldShowLinks) {
        const relevantContent = this.searchRelevantContent(query);
        enhancedResponse = response + relevantContent;
      }
      
      // Add assistant response to session if available
      if (session) {
        session.addMessage('assistant', enhancedResponse);
        try {
          await session.save();
        } catch (error) {
          console.warn('Could not save session:', error);
        }
      }
      
      // Parse response and return as AIResponse array
      return this.parseAIResponse(enhancedResponse);
      
    } catch (error) {
      console.error('Groq API Error:', error);
      return [{
        content: "I'm having trouble connecting to my AI brain right now. Please try again in a moment!",
        kind: 'hint',
        class: 'error'
      }];
    }
  }

  // Build comprehensive system prompt
  private buildSystemPrompt(course: Course, user: UserDocument | null, progress?: ProgressDocument): string {
    const courseKnowledge = this.courseKnowledge.get(course.id) || '';
    
    // Limit course knowledge to prevent token overflow (max 800 chars)
    const limitedKnowledge = courseKnowledge.length > 800 
      ? courseKnowledge.substring(0, 800) + '...' 
      : courseKnowledge;
    
    let prompt = `You are Stewie, an AI Learning Guide for Kha-Boom! educational platform. You are NOT a teacher - you are a learning mentor who guides students on their educational journey.

COURSE: ${course.title}
${course.description || 'Interactive mathematics course'}

COURSE CONTENT OVERVIEW:
${limitedKnowledge}

YOUR ROLE AS A LEARNING GUIDE:
- Understand what students want to learn and guide them to the right course content
- Guide students on WHAT to learn next based on their progress
- Suggest WHERE to find information and resources
- Recommend learning paths and study strategies
- Track progress and adapt guidance accordingly
- Encourage and motivate students
- Help students understand their learning journey
- Provide personalized learning recommendations
- Help students find specific courses and sections that match their learning goals

GUIDANCE APPROACH:
- When students express learning intent (e.g., "I want to learn X", "Tell me about Y"), guide them to relevant course content
- Analyze student's current progress and learning level
- Suggest specific next learning objectives
- Recommend where to focus their study time
- Guide them to appropriate course sections or resources
- Provide encouragement based on their progress
- Suggest study strategies that work for their level
- Help them understand what they should prioritize
- Acknowledge their learning interests and direct them to relevant courses

RESPONSE STYLE:
- Be encouraging and supportive
- Give clear, actionable guidance on what to learn next
- Suggest specific areas to focus on
- Recommend study approaches
- Provide motivation and encouragement
- When students want to learn something specific, acknowledge their interest and guide them to relevant courses
- NEVER teach content directly
- NEVER ask questions
- NEVER include HTML, Pug, or code snippets
- Focus on LEARNING GUIDANCE and directing students to appropriate course content
- Keep responses concise and actionable`;

        // Add minimal user context
        if (user) {
          prompt += `\n\nSTUDENT PROFILE:
Name: ${user.fullName || user.firstName || 'Student'}
Age: ${user.age || 'Not specified'}
Type: ${user.type || 'Not specified'}

Use this information to personalize your mentoring approach.`;
        }

    // Add detailed progress context for better mentoring
    if (progress) {
      const progressPercent = Math.round(progress.progress);
      const sections = progress.sections || new Map();
      const completedSections = Array.from(sections.values()).filter(s => s.completed).length;
      const totalSections = sections.size;
      
      prompt += `\n\nLEARNING PROGRESS:
Course Progress: ${progressPercent}% complete
Current Section: ${progress.activeSection || 'Beginning'}
Completed Sections: ${completedSections}/${totalSections}
Last Activity: ${progress.updatedAt ? new Date(progress.updatedAt).toLocaleDateString() : 'Unknown'}

LEARNING GUIDANCE:
Based on this progress, provide personalized guidance:
- If progress is low (0-30%): Guide them to foundational concepts and suggest where to start learning
- If progress is medium (31-70%): Recommend intermediate topics and suggest study approaches
- If progress is high (71-100%): Guide them to advanced applications and mastery-level resources
- Suggest specific learning objectives based on their current section
- Recommend study strategies and learning approaches
- Guide them to appropriate course sections and resources`;
    }

    return prompt;
  }

  // Determine if user is asking for specific content that should show links
  private shouldShowSearchLinks(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Enhanced keywords that indicate user wants specific content or links
    const linkKeywords = [
      // Learning intent
      'show me', 'tell me about', 'learn about', 'teach me', 'explain',
      'where can i', 'how do i learn', 'what is', 'what are',
      'show course', 'show content', 'find', 'search', 'link',
      'navigate to', 'go to', 'take me to', 'direct me to',
      
      // Specific learning requests
      'i want to learn', 'i need to learn', 'help me learn',
      'can you teach me', 'how to learn', 'where to learn',
      'i want to study', 'i need to study', 'help me study',
      
      // Course-specific requests
      'course on', 'lesson on', 'chapter on', 'section on',
      'tutorial on', 'guide on', 'material on',
      
      // Subject-specific requests
      'mathematics', 'math', 'algebra', 'geometry', 'calculus',
      'probability', 'statistics', 'trigonometry', 'arithmetic',
      'circles', 'polygons', 'quadratics', 'primes', 'divisibility'
    ];
    
    // Check if query contains any of these keywords
    return linkKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Search for relevant course content and create clickable links
  private searchRelevantContent(query: string): string {
    try {
      // Try multiple search strategies for better results
      let searchResults = search(query);
      
      // If no results, try alternative search terms
      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        searchResults = this.tryAlternativeSearches(query);
      }
      
      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        // If still no results found, provide alternative suggestions
        return this.getAlternativeSuggestions(query);
      }

      let linksHtml = '<div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.1);">';
      linksHtml += '<div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.6rem; text-align: center;">📚 Relevant Course Content</div>';
      
      let validResults = 0;
      
      for (const result of searchResults.slice(0, 5)) {
        if (!result || !result.url || !result.title) {
          console.log(`Invalid result - missing url or title:`, result);
          continue;
        }
        
        // Validate URL format - must start with /course/
        if (!result.url.startsWith('/course/')) {
          console.log(`Invalid result - wrong URL format:`, result.url);
          continue;
        }
        
        // Validate that it's not a glossary entry (gloss: prefix)
        if (result.id && result.id.startsWith('gloss:')) {
          console.log(`Skipping glossary entry:`, result.id);
          continue;
        }
        
        // Validate that title is not empty or too short
        if (result.title.length < 3) {
          console.log(`Invalid result - title too short:`, result.title);
          continue;
        }
        
        // Check if this is a valid course URL by checking it exists in available courses
        const urlParts = result.url.split('/');
        if (urlParts.length >= 3 && urlParts[1] === 'course') {
          const courseId = urlParts[2];
          // Validate against known course IDs
          const knownCourses = ['circles', 'divisibility', 'polyhedra', 'probability', 'quadratics'];
          if (!knownCourses.includes(courseId)) {
            console.log(`Invalid result - unknown course ID:`, courseId);
            continue;
          }
        }
        
        const courseName = result.subtitle || 'Course';
        const imageStyle = result.image ? result.image : 'background: linear-gradient(135deg, #667eea, #764ba2);';
        
        linksHtml += `
          <a href="${result.url}" style="display: flex; align-items: center; padding: 0.5rem 0.7rem; margin: 0 auto 0.3rem; background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; text-decoration: none; transition: all 0.3s; width: calc(100% - 1.4rem); max-width: 320px; box-sizing: border-box;" 
             onmouseover="this.style.background='linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.08))'; this.style.transform='scale(1.02)'; this.style.borderColor='rgba(139,92,246,0.3)'" 
             onmouseout="this.style.background='linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))'; this.style.transform='scale(1)'; this.style.borderColor='rgba(255,255,255,0.1)'">
            <div style="width: 28px; height: 28px; min-width: 28px; border-radius: 6px; margin-right: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); background-size: cover; background-position: center; flex-shrink: 0; ${imageStyle}"></div>
            <div style="flex: 1; min-width: 0; overflow: hidden;">
              <div style="font-size: 0.6rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${courseName}</div>
              <div style="font-size: 0.75rem; color: rgba(255,255,255,0.95); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${result.title}</div>
            </div>
          </a>
        `;
        
        validResults++;
        if (validResults >= 3) break;
      }
      
      linksHtml += '</div>';
      
      // If no valid results were found, return alternative suggestions
      if (validResults === 0) {
        return this.getAlternativeSuggestions(query);
      }
      
      return linksHtml;
    } catch (error) {
      console.warn('Search error:', error);
      return this.getAlternativeSuggestions(query);
    }
  }

  // Try alternative search terms when initial search fails
  private tryAlternativeSearches(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    
    // Map common learning requests to course topics
    const searchMappings = {
      'circles': ['circles', 'pi', 'radius', 'diameter', 'circumference'],
      'polygons': ['polygons', 'shapes', 'geometry', 'triangles', 'squares'],
      'probability': ['probability', 'chance', 'random', 'statistics'],
      'quadratics': ['quadratics', 'quadratic', 'equations', 'algebra'],
      'primes': ['primes', 'prime', 'divisibility', 'factors', 'numbers'],
      'math': ['mathematics', 'math', 'algebra', 'geometry', 'arithmetic'],
      'geometry': ['geometry', 'shapes', 'polygons', 'circles', 'angles'],
      'algebra': ['algebra', 'equations', 'quadratics', 'variables']
    };
    
    // Try different search terms based on the query
    for (const [topic, keywords] of Object.entries(searchMappings)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        const results = search(topic);
        if (results && Array.isArray(results) && results.length > 0) {
          return results;
        }
      }
    }
    
    // Try searching for individual words
    const words = query.split(' ').filter(word => word.length > 2);
    for (const word of words) {
      const results = search(word);
      if (results && Array.isArray(results) && results.length > 0) {
        return results;
      }
    }
    
    return [];
  }

  // Provide alternative suggestions when no courses are found
  private getAlternativeSuggestions(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Check if user is asking for something not available
    if (lowerQuery.includes('learn') || lowerQuery.includes('study') || lowerQuery.includes('course')) {
      return `
        <div style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.6rem; text-align: center;">💡 Available Courses</div>
          <div style="text-align: center; color: rgba(255,255,255,0.8); font-size: 0.75rem; line-height: 1.3;">
            While we don't have a specific course for "${query}", here are the courses we currently offer:
            <br><br>
            <strong>Available Courses:</strong><br>
            • <a href="/course/circles/introduction" style="color: #667eea; text-decoration: none;">Circles and Pi</a> - Intermediate mathematics<br>
            • <a href="/course/divisibility/primes" style="color: #667eea; text-decoration: none;">Divisibility and Primes</a> - Foundations of number theory<br>
            • <a href="/course/polyhedra/polygons" style="color: #667eea; text-decoration: none;">Polygons</a> - Intermediate geometry<br>
            • <a href="/course/probability/introduction" style="color: #667eea; text-decoration: none;">Probability</a> - Intermediate probability theory<br>
            • <a href="/course/quadratics/introduction" style="color: #667eea; text-decoration: none;">Quadratic Equations</a> - Intermediate algebra<br>
            <br>
            Feel free to ask me about any of these topics!
          </div>
        </div>
      `;
    }
    
    return '';
  }

  // Parse AI response into structured format
  private parseAIResponse(response: string): AIResponse[] {
    // Clean the response to remove any HTML/Pug code or unwanted content
    // But preserve our search result links
    let cleanResponse = response
      .replace(/include\s+[^\s]+/g, '') // Remove Pug include statements
      .replace(/x-picker[^>]*>/g, '') // Remove x-picker elements
      .replace(/\.item[^>]*>/g, '') // Remove .item elements
      .replace(/svg\/[^\s]+/g, '') // Remove SVG references
      .replace(/data-error[^>]*>/g, '') // Remove data-error attributes
      .replace(/\.item#item\d+/g, '') // Remove .item#item1, .item#item2, etc.
      .replace(/\.item\(data-error="[^"]*"\)/g, '') // Remove .item(data-error="...")
      .replace(/\.item:/g, '') // Remove .item: statements
      .replace(/x-picker\s+/g, '') // Remove x-picker with spaces
      .replace(/include\s+svg\/[^\s]+/g, '') // Remove include svg/ statements
      .replace(/Can you identify which shapes meet these three criteria\?/g, '') // Remove specific problematic text
      .replace(/Which ones do you think are polygons\?/g, '') // Remove specific problematic text
      .replace(/Take a look at the shapes again:/g, '') // Remove specific problematic text
      .replace(/Now, take a look at the shapes again:/g, '') // Remove specific problematic text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If response is too short or empty, provide a fallback
    if (cleanResponse.length < 10) {
      cleanResponse = "I'm here to help you learn! Feel free to ask me any questions about the course material.";
    }
    
    return [{
      content: cleanResponse,
      kind: 'hint'
    }];
  }

  // Get available chat sessions for a user
  public async getUserChatSessions(userId: string): Promise<ChatSessionDocument[]> {
    try {
      return await ChatSession.findByUser(userId);
    } catch (error) {
      console.warn('Database not available, returning empty sessions:', error);
      return [];
    }
  }

  // Get learning recommendations based on progress
  public async getLearningRecommendations(
    user: UserDocument | null,
    course: Course,
    progress?: ProgressDocument
  ): Promise<AIResponse[]> {
    const systemPrompt = `You are Stewie, an AI Learning Guide. Provide personalized learning guidance based on the student's progress.

COURSE: ${course.title}
${course.description || 'Interactive mathematics course'}

STUDENT: ${user?.fullName || user?.firstName || 'Student'}${user?.age ? `, age ${user.age}` : ''}
PROGRESS: ${progress ? Math.round(progress.progress) : 0}% complete
CURRENT SECTION: ${progress?.activeSection || 'Beginning'}

Provide specific, actionable learning guidance:
- What should they focus on learning next?
- Which course sections should they prioritize?
- What study approach would work best for them?
- Where should they spend their learning time?
- What learning objectives should they set?

Focus on GUIDANCE, not teaching. Be encouraging and actionable.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'What learning recommendations do you have for me?'}
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 800,
        stream: false
      });
      
      const response = completion.choices[0]?.message?.content || 'I recommend continuing with the current section and practicing the concepts you\'ve learned.';
      return this.parseAIResponse(response);
      
    } catch (error) {
      console.error('Learning recommendations error:', error);
      return [{
        content: "I recommend focusing on the current section and practicing regularly. Keep up the great work!",
        kind: 'hint'
      }];
    }
  }

  // Analyze learning patterns and provide insights
  public async analyzeLearningPatterns(
    user: UserDocument | null,
    course: Course,
    progress?: ProgressDocument
  ): Promise<AIResponse[]> {
    const systemPrompt = `You are Stewie, an AI Learning Guide. Analyze the student's learning patterns and provide guidance insights.

COURSE: ${course.title}
STUDENT: ${user?.fullName || user?.firstName || 'Student'}
PROGRESS: ${progress ? Math.round(progress.progress) : 0}% complete
CURRENT SECTION: ${progress?.activeSection || 'Beginning'}

Provide guidance insights about their learning journey:
- What learning patterns do you notice?
- What are their learning strengths?
- What areas should they focus on next?
- How can they optimize their study approach?
- What learning strategies would work best for them?
- Where should they direct their learning efforts?

Focus on GUIDANCE and learning direction, not teaching content. Be encouraging and actionable.`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: 'Can you analyze my learning patterns and give me insights?'}
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
        max_tokens: 800,
        stream: false
      });
      
      const response = completion.choices[0]?.message?.content || 'You\'re making great progress! Keep practicing regularly and don\'t hesitate to ask questions when you need help.';
      return this.parseAIResponse(response);
      
    } catch (error) {
      console.error('Learning analysis error:', error);
      return [{
        content: "You're doing well! Keep practicing and stay curious about the concepts you're learning.",
        kind: 'hint'
      }];
    }
  }
}

// Singleton instance
export const aiService = new AIService();
