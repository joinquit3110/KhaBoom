import { ElementView, $N } from '@mathigon/boost';

/**
 * A notification system component for displaying messages to the user.
 */
export class Notification {
  /**
   * Creates a new Notification instance.
   * @param {Object} options - Configuration options
   * @param {string} options.containerSelector - Selector for the notifications container
   */
  constructor(options) {
    this.container = new ElementView(options.containerSelector);
    this.notifications = new Map(); // Store active notifications by ID
    this.counter = 0; // Used to generate unique IDs
  }
  
  /**
   * Shows a notification
   * @param {Object} options - Notification options
   * @param {string} options.type - Notification type ('info', 'success', 'warning', 'error')
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {number} [options.duration=3000] - Duration in milliseconds before auto-dismiss
   * @param {boolean} [options.dismissible=true] - Whether the notification can be dismissed
   * @returns {string} The notification ID
   */
  show(options) {
    const id = `notification-${++this.counter}`;
    const type = options.type || 'info';
    const duration = options.duration || 3000;
    const dismissible = options.dismissible !== false;
    
    // Create notification element
    const notification = $N('div', {
      class: `notification ${type}`,
      id
    });
    
    // Create notification content
    const content = $N('div', { class: 'notification-content' });
    
    if (options.title) {
      const title = $N('h4', {}, options.title);
      content.append(title);
    }
    
    if (options.message) {
      const message = $N('p', {}, options.message);
      content.append(message);
    }
    
    notification.append(content);
    
    // Add close button if dismissible
    if (dismissible) {
      const closeButton = $N('button', { class: 'close-btn' }, '×');
      closeButton.on('click', () => this.dismiss(id));
      notification.append(closeButton);
    }
    
    // Add to container
    this.container.prepend(notification);
    
    // Store reference
    this.notifications.set(id, {
      element: notification,
      timeoutId: null
    });
    
    // Set auto-dismiss timeout
    if (duration > 0) {
      const timeoutId = setTimeout(() => this.dismiss(id), duration);
      this.notifications.get(id).timeoutId = timeoutId;
    }
    
    // Add event listener for hover to pause timeout
    notification.on('mouseenter', () => {
      const notifData = this.notifications.get(id);
      if (notifData && notifData.timeoutId) {
        clearTimeout(notifData.timeoutId);
        notifData.timeoutId = null;
      }
    });
    
    // Resume timeout on mouse leave
    notification.on('mouseleave', () => {
      const notifData = this.notifications.get(id);
      if (notifData && !notifData.timeoutId && duration > 0) {
        notifData.timeoutId = setTimeout(() => this.dismiss(id), duration);
      }
    });
    
    return id;
  }
  
  /**
   * Dismisses a notification
   * @param {string} id - The notification ID
   */
  dismiss(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    // Clear timeout if exists
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
    
    // Add exit animation class
    notification.element.addClass('exit');
    
    // Remove element after animation
    setTimeout(() => {
      notification.element.remove();
      this.notifications.delete(id);
    }, 300);
  }
  
  /**
   * Dismisses all notifications
   */
  dismissAll() {
    for (const id of this.notifications.keys()) {
      this.dismiss(id);
    }
  }
  
  /**
   * Convenience method to show an info notification
   * @param {string} message - The notification message
   * @param {Object} [options={}] - Additional options
   * @returns {string} The notification ID
   */
  info(message, options = {}) {
    return this.show({
      type: 'info',
      message,
      ...options
    });
  }
  
  /**
   * Convenience method to show a success notification
   * @param {string} message - The notification message
   * @param {Object} [options={}] - Additional options
   * @returns {string} The notification ID
   */
  success(message, options = {}) {
    return this.show({
      type: 'success',
      message,
      ...options
    });
  }
  
  /**
   * Convenience method to show a warning notification
   * @param {string} message - The notification message
   * @param {Object} [options={}] - Additional options
   * @returns {string} The notification ID
   */
  warning(message, options = {}) {
    return this.show({
      type: 'warning',
      message,
      ...options
    });
  }
  
  /**
   * Convenience method to show an error notification
   * @param {string} message - The notification message
   * @param {Object} [options={}] - Additional options
   * @returns {string} The notification ID
   */
  error(message, options = {}) {
    return this.show({
      type: 'error',
      message,
      duration: 5000, // Errors stay longer by default
      ...options
    });
  }
} 