import { ElementView, $N } from '@mathigon/boost';

/**
 * A chatbot component that provides math tutoring assistance.
 */
export class ChatBot {
  /**
   * Creates a new ChatBot instance.
   * @param {Object} options - Configuration options
   * @param {string} options.containerSelector - Selector for the chat container
   * @param {string} options.headerSelector - Selector for the chat header
   * @param {string} options.messagesSelector - Selector for the messages container
   * @param {string} options.inputSelector - Selector for the input field
   * @param {string} options.sendButtonSelector - Selector for the send button
   * @param {string} options.closeButtonSelector - Selector for the close button
   */
  constructor(options) {
    this.container = new ElementView(options.containerSelector);
    this.header = this.container.$(options.headerSelector);
    this.messagesContainer = this.container.$(options.messagesSelector);
    this.input = this.container.$(options.inputSelector);
    this.sendButton = this.container.$(options.sendButtonSelector);
    this.closeButton = this.container.$(options.closeButtonSelector);
    
    this.isActive = false;
    
    // Sample responses based on keywords
    this.responses = {
      'hi': 'Hello! How can I help you with math today?',
      'hello': 'Hi there! I\'m your math tutor. What would you like to learn?',
      'help': 'I can help you with various math topics. Just ask me about algebra, geometry, calculus, or any other math subject!',
      'algebra': 'Algebra is all about finding unknown values. What specific part are you struggling with?',
      'geometry': 'Geometry deals with shapes and spaces. Do you have a specific question about angles, triangles, or circles?',
      'calculus': 'Calculus is about rates of change and accumulation. Are you learning derivatives or integrals?',
      'equation': 'When solving equations, remember to perform the same operation on both sides to maintain balance. What equation are you trying to solve?',
      'triangle': 'A triangle has three sides and the sum of its angles is always 180 degrees. Are you working on a specific property of triangles?',
      'pythagoras': 'The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²',
      'pi': 'π (pi) is the ratio of a circle\'s circumference to its diameter, approximately equal to 3.14159. It appears in many formulas in geometry and trigonometry.',
      'default': 'I\'m not sure I understand. Could you phrase your question differently or provide more details?'
    };
    
    // Predefined hints for common topics
    this.hints = [
      'Remember that dividing by a fraction is the same as multiplying by its reciprocal.',
      'When solving quadratic equations, the quadratic formula is x = (-b ± √(b² - 4ac)) / 2a.',
      'The area of a circle is πr², where r is the radius.',
      'The derivative of sin(x) is cos(x), and the derivative of cos(x) is -sin(x).',
      'To find the slope of a line, use the formula (y₂ - y₁) / (x₂ - x₁).',
      'The sum of interior angles in a polygon with n sides is (n - 2) × 180°.'
    ];
    
    this._setupEventListeners();
    this._showInitialMessage();
  }
  
  /**
   * Sets up event listeners for chat interactions
   * @private
   */
  _setupEventListeners() {
    // Toggle chat visibility on header click
    this.header.on('click', () => this.toggle());
    
    // Close chat when close button is clicked
    this.closeButton.on('click', (e) => {
      e.stopPropagation();
      this.hide();
    });
    
    // Send message on button click
    this.sendButton.on('click', () => this._sendMessage());
    
    // Send message on Enter key press
    this.input.on('keypress', (e) => {
      if (e.key === 'Enter') this._sendMessage();
    });
  }
  
  /**
   * Shows the initial welcome message
   * @private
   */
  _showInitialMessage() {
    const initialMessages = [
      {
        text: 'Hello! I\'m your math tutor. Feel free to ask me any math questions.',
        isBot: true
      },
      {
        text: 'You can ask about concepts, formulas, or how to solve specific problems.',
        isBot: true
      }
    ];
    
    // Add a small delay to make it feel more natural
    setTimeout(() => {
      initialMessages.forEach(msg => this._addMessage(msg.text, msg.isBot));
      
      // Offer a hint after a delay
      setTimeout(() => {
        const randomHint = this.hints[Math.floor(Math.random() * this.hints.length)];
        this._addMessage(`Tip: ${randomHint}`, true, 'hint');
      }, 1500);
    }, 800);
  }
  
  /**
   * Sends a user message and gets a response
   * @private
   */
  _sendMessage() {
    const message = this.input.value.trim();
    if (!message) return;
    
    // Add user message to chat
    this._addMessage(message, false);
    
    // Clear input field
    this.input.value = '';
    
    // Generate response (with slight delay to seem more natural)
    setTimeout(() => {
      const response = this._getResponse(message);
      this._addMessage(response, true);
      
      // Occasionally show a "typing" indicator
      if (Math.random() > 0.7) {
        this._showTypingIndicator();
        
        // Offer a follow-up hint sometimes
        setTimeout(() => {
          const randomHint = this.hints[Math.floor(Math.random() * this.hints.length)];
          this._addMessage(`By the way, did you know: ${randomHint}`, true, 'hint');
        }, 1500);
      }
    }, 800);
  }
  
  /**
   * Adds a message to the chat
   * @param {string} text - The message text
   * @param {boolean} isBot - Whether the message is from the bot
   * @param {string} [type='normal'] - The message type (normal or hint)
   * @private
   */
  _addMessage(text, isBot, type = 'normal') {
    const messageClass = isBot ? 'bot-message' : 'user-message';
    const typeClass = type === 'hint' ? 'hint-message' : '';
    
    const message = $N('div', { class: `message ${messageClass} ${typeClass}` });
    
    if (isBot) {
      const avatar = $N('div', { class: 'bot-avatar' }, 'M');
      message.append(avatar);
    }
    
    const content = $N('div', { class: 'message-content' }, text);
    message.append(content);
    
    this.messagesContainer.append(message);
    
    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  
  /**
   * Shows a typing indicator
   * @private
   */
  _showTypingIndicator() {
    const indicator = $N('div', { class: 'message bot-message typing-indicator' });
    const avatar = $N('div', { class: 'bot-avatar' }, 'M');
    const dots = $N('div', { class: 'typing-dots' });
    
    for (let i = 0; i < 3; i++) {
      dots.append($N('span', { class: 'dot' }));
    }
    
    indicator.append(avatar, dots);
    this.messagesContainer.append(indicator);
    
    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    
    // Remove typing indicator after a delay
    setTimeout(() => {
      indicator.remove();
    }, 1500);
  }
  
  /**
   * Generates a response based on the user's message
   * @param {string} message - The user's message
   * @returns {string} The bot's response
   * @private
   */
  _getResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for keywords in the message
    for (const [keyword, response] of Object.entries(this.responses)) {
      if (keyword !== 'default' && lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    // Check if it's a math expression
    if (/[\d+\-*/().^\s]+/.test(message) && !message.match(/[a-zA-Z]/)) {
      try {
        const result = eval(message.replace('^', '**'));
        return `The result of ${message} is ${result}.`;
      } catch (e) {
        return 'I couldn\'t evaluate that expression. Please check the syntax.';
      }
    }
    
    // Default response
    return this.responses.default;
  }
  
  /**
   * Toggles the visibility of the chat panel
   */
  toggle() {
    if (this.isActive) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Shows the chat panel
   */
  show() {
    this.container.addClass('active');
    this.isActive = true;
  }
  
  /**
   * Hides the chat panel
   */
  hide() {
    this.container.removeClass('active');
    this.isActive = false;
  }
} 