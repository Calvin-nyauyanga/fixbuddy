// ============================================
// CHATBOT FRONTEND APP
// Location: client/UserDashboard/chatbot/app.js
// Purpose: Handle chatbot UI interactions and API calls
// ============================================

class ChatbotApp {
  constructor() {
    // Configuration
    this.apiBaseUrl = 'http://localhost:5000/api/chatbot';
    this.authToken = localStorage.getItem('authToken');
    this.userId = this.extractUserIdFromToken();
    this.currentSessionId = null;
    this.currentLanguage = localStorage.getItem('chatbotLanguage') || 'en';
    this.isMinimized = false;
    this.messageCount = 0;
    this.turnCount = 0;

    // DOM Elements
    this.elements = {
      wrapper: document.querySelector('.chatbot-wrapper'),
      messagesContainer: document.getElementById('chatbotMessages'),
      input: document.getElementById('chatbotInput'),
      sendBtn: document.getElementById('sendButton'),
      closeBtn: document.getElementById('closeChatbot'),
      fab: document.getElementById('chatbotFab'),
      fabBadge: document.getElementById('fabBadge'),
      languageSelect: document.getElementById('languageSelect'),
      escalateBtn: document.getElementById('escalateBtn'),
      ticketBtn: document.getElementById('ticketBtn'),
      typingIndicator: document.getElementById('typingIndicator'),
      suggestedReplies: document.getElementById('suggestedReplies'),
      // Modals
      ticketModal: document.getElementById('ticketModal'),
      escalationModal: document.getElementById('escalationModal'),
    };

    // Bind methods
    this.init = this.init.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

    // Initialize
    this.init();
  }

  /**
   * Initialize chatbot
   */
  async init() {
    // Wait for DOM if needed
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Check authentication
    if (!this.authToken) {
      this.showError('Please log in to use the chatbot');
      return;
    }

    // Verify critical elements exist
    if (!this.elements.wrapper) {
      console.error('❌ Chatbot wrapper not found. Chatbot initialization failed.');
      return;
    }

    // Create or restore session
    await this.createSession();

    // Attach event listeners
    this.attachEventListeners();

    // Load conversation history
    await this.loadConversationHistory();

    // Show welcome message
    this.showWelcomeMessage();

    console.log('✅ Chatbot initialized');
  }

  /**
   * Extract user ID from JWT token
   */
  extractUserIdFromToken() {
    if (!this.authToken) return null;

    try {
      const payload = JSON.parse(atob(this.authToken.split('.')[1]));
      return payload.id || payload.userId;
    } catch (error) {
      console.error('Failed to extract user ID from token:', error);
      return null;
    }
  }

  /**
   * Create a new chat session
   */
  async createSession() {
    // In production, call backend to create session
    // For now, use a temporary session ID
    this.currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('📝 Session created:', this.currentSessionId);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Validate that required elements exist
    if (!this.elements.sendBtn || !this.elements.input || !this.elements.closeBtn) {
      console.error('❌ Critical chatbot elements not found in DOM');
      console.error('sendBtn:', !!this.elements.sendBtn);
      console.error('input:', !!this.elements.input);
      console.error('closeBtn:', !!this.elements.closeBtn);
      return;
    }

    // Send message
    this.elements.sendBtn.addEventListener('click', this.sendMessage);
    this.elements.input.addEventListener('keypress', this.handleKeyPress);

    // Close chatbot
    this.elements.closeBtn.addEventListener('click', () => this.toggleMinimize());

    // Language selection
    if (this.elements.languageSelect) {
      this.elements.languageSelect.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
        localStorage.setItem('chatbotLanguage', e.target.value);
        console.log('🌐 Language changed to:', e.target.value);
      });
    }

    // Action buttons
    if (this.elements.escalateBtn) {
      this.elements.escalateBtn.addEventListener('click', () => this.showEscalationModal());
    }
    if (this.elements.ticketBtn) {
      this.elements.ticketBtn.addEventListener('click', () => this.showTicketModal());
    }

    // Modal controls
    const closeTicketBtn = document.getElementById('closeTicketModal');
    if (closeTicketBtn) {
      closeTicketBtn.addEventListener('click', () => {
        this.closeModal('ticketModal');
      });
    }

    const cancelTicketBtn = document.getElementById('cancelTicketBtn');
    if (cancelTicketBtn) {
      cancelTicketBtn.addEventListener('click', () => {
        this.closeModal('ticketModal');
      });
    }

    const submitTicketBtn = document.getElementById('submitTicketBtn');
    if (submitTicketBtn) {
      submitTicketBtn.addEventListener('click', () => {
        this.submitTicket();
      });
    }

    const closeEscalationBtn = document.getElementById('closeEscalationModal');
    if (closeEscalationBtn) {
      closeEscalationBtn.addEventListener('click', () => {
        this.closeModal('escalationModal');
      });
    }

    const cancelEscalationBtn = document.getElementById('cancelEscalationBtn');
    if (cancelEscalationBtn) {
      cancelEscalationBtn.addEventListener('click', () => {
        this.closeModal('escalationModal');
      });
    }

    // FAB
    if (this.elements.fab) {
      this.elements.fab.addEventListener('click', () => this.toggleMinimize());
    }
  }

  /**
   * Handle Enter key press
   */
  handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Send message to chatbot
   */
  async sendMessage() {
    // Validate elements
    if (!this.elements.input) {
      console.error('❌ Input element not found');
      return;
    }

    const message = this.elements.input.value.trim();

    if (!message) {
      this.shake(this.elements.input);
      return;
    }

    // Add user message to UI
    this.addMessage(message, 'user');

    // Clear input
    this.elements.input.value = '';

    // Disable send button
    if (this.elements.sendBtn) {
      this.elements.sendBtn.disabled = true;
    }

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Send to backend
      const response = await this.callChatbotAPI(message);

      // Remove typing indicator
      this.hideTypingIndicator();

      // Add bot response
      if (response.success) {
        this.addMessage(response.response, 'bot', {
          category: response.category,
          confidence: response.confidence,
          isTroubleshootingFlow: response.isTroubleshootingFlow,
        });

        this.turnCount++;

        // Check if should escalate
        if (response.shouldEscalate) {
          this.showEscalationSuggestion();
        }
      } else {
        this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', { type: 'error' });
      }
    } catch (error) {
      this.hideTypingIndicator();
      console.error('Error sending message:', error);
      this.addMessage('Connection error. Please check your internet and try again.', 'bot', { type: 'error' });
    } finally {
      if (this.elements.sendBtn) {
        this.elements.sendBtn.disabled = false;
      }
      if (this.elements.input) {
        this.elements.input.focus();
      }
    }
  }

  /**
   * Call chatbot API
   */
  async callChatbotAPI(message) {
    const response = await fetch(`${this.apiBaseUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        message,
        sessionId: this.currentSessionId,
        language: this.currentLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Add message to chat UI
   */
  addMessage(content, sender = 'bot', metadata = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    if (metadata.type === 'error') {
      messageDiv.classList.add('error-message');
    } else if (metadata.type === 'system') {
      messageDiv.classList.add('system-message');
    } else if (metadata.type === 'success') {
      messageDiv.classList.add('success-message');
    }

    // Format troubleshooting steps
    let formattedContent = content;
    if (metadata.isTroubleshootingFlow) {
      messageDiv.classList.add('troubleshooting-steps');
      // Convert numbered list to HTML
      const steps = content.split('\n\n').map((step, idx) => `<li>${step}</li>`).join('');
      formattedContent = `<ol>${steps}</ol>`;
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formattedContent;

    const timeDiv = document.createElement('span');
    timeDiv.className = 'message-time';
    timeDiv.textContent = this.getCurrentTime();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);

    // Add feedback buttons (only for bot messages)
    if (sender === 'bot') {
      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'message-feedback';
      feedbackDiv.style.marginTop = '8px';
      feedbackDiv.style.padding = '0 16px';
      feedbackDiv.innerHTML = `
        <button class="feedback-btn" data-rating="helpful" title="This was helpful">
          <i class="fas fa-thumbs-up"></i> Helpful
        </button>
        <button class="feedback-btn" data-rating="not-helpful" title="This wasn't helpful">
          <i class="fas fa-thumbs-down"></i> Not helpful
        </button>
      `;

      feedbackDiv.querySelectorAll('.feedback-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          this.submitFeedback(e.currentTarget.dataset.rating);
          feedbackDiv.remove();
        });
      });

      messageDiv.appendChild(feedbackDiv);
    }

    // Add to messages container
    this.elements.messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    this.scrollToBottom();

    this.messageCount++;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.elements.typingIndicator.style.display = 'flex';
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.elements.typingIndicator.style.display = 'none';
  }

  /**
   * Show escalation suggestion
   */
  showEscalationSuggestion() {
    const suggestion = document.createElement('div');
    suggestion.className = 'system-message';
    suggestion.innerHTML = `
      <div class="message-content">
        <p>😕 I'm having trouble solving this completely. Would you like me to:</p>
        <button class="suggested-btn" onclick="chatbot.showEscalationModal()">
          <i class="fas fa-phone"></i> Connect with support agent
        </button>
        <button class="suggested-btn" onclick="chatbot.showTicketModal()">
          <i class="fas fa-ticket-alt"></i> Create a support ticket
        </button>
      </div>
    `;
    this.elements.messagesContainer.appendChild(suggestion);
    this.scrollToBottom();
  }

  /**
   * Load conversation history
   */
  async loadConversationHistory() {
    // In production, fetch from backend
    // For now, this is handled by backend
    console.log('📖 Loading conversation history for session:', this.currentSessionId);
  }

  /**
   * Show welcome message
   */
  async showWelcomeMessage() {
    // Fetch personalized greeting from backend (optional)
    // For now, show default welcome
    const suggestions = [
      'My computer is running slow',
      'How do I reset my password?',
      'I cannot connect to WiFi',
      'My printer is not working',
      'Is my data secure?',
    ];

    // Show suggested questions after a short delay
    setTimeout(() => {
      this.showSuggestedReplies(suggestions);
    }, 500);
  }

  /**
   * Show suggested replies
   */
  showSuggestedReplies(suggestions) {
    const container = this.elements.suggestedReplies.querySelector('.suggested-buttons');
    container.innerHTML = '';

    suggestions.forEach((suggestion) => {
      const btn = document.createElement('button');
      btn.className = 'suggested-btn';
      btn.textContent = suggestion;
      btn.addEventListener('click', () => {
        this.elements.input.value = suggestion;
        this.sendMessage();
      });
      container.appendChild(btn);
    });

    this.elements.suggestedReplies.style.display = 'block';
  }

  /**
   * Show ticket creation modal
   */
  showTicketModal() {
    this.elements.ticketModal.style.display = 'flex';
  }

  /**
   * Show escalation modal
   */
  showEscalationModal() {
    this.elements.escalationModal.style.display = 'flex';
    this.escalateToSupport();
  }

  /**
   * Close modal
   */
  closeModal(modalId) {
    this.elements[modalId].style.display = 'none';
  }

  /**
   * Submit ticket
   */
  async submitTicket() {
    const summary = document.getElementById('ticketSummary').value.trim();
    const description = document.getElementById('ticketDescription').value.trim();
    const urgency = document.getElementById('ticketUrgency').value;
    const category = document.getElementById('ticketCategory').value;

    if (!summary || !description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          sessionId: this.currentSessionId,
          summary,
          description,
          urgency,
          category,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.addMessage(`✅ ${result.message}\n\nTicket ID: #${result.ticketId}`, 'bot', {
          type: 'success',
        });
        this.closeModal('ticketModal');

        // Reset form
        document.getElementById('ticketForm').reset();
      } else {
        alert('Error creating ticket: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    }
  }

  /**
   * Escalate to support
   */
  async escalateToSupport() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          sessionId: this.currentSessionId,
          reason: 'user_requested',
        }),
      });

      const result = await response.json();

      if (result.success) {
        document.getElementById('escalationInfo').innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <i class="fas fa-check-circle" style="font-size: 48px; color: var(--success-color); margin-bottom: 10px;"></i>
            <p><strong>Connected!</strong></p>
            <p>A support agent will be with you shortly.</p>
            <p style="font-size: 12px; color: #999; margin-top: 10px;">
              Agents available: ${result.assignedAgents?.length || 0}
            </p>
          </div>
        `;

        // Add system message
        this.addMessage(result.message, 'bot', { type: 'system' });
      }
    } catch (error) {
      console.error('Error escalating:', error);
      this.addMessage('Failed to connect with support. Please try again.', 'bot', { type: 'error' });
    }
  }

  /**
   * Submit feedback on response
   */
  async submitFeedback(rating) {
    // In production, call backend to save feedback
    console.log('📝 Feedback submitted:', rating);

    // Show confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.textContent = '✅ Thank you for your feedback!';
    confirmDiv.style.cssText = `
      padding: 8px 12px;
      background: #d4edda;
      color: #155724;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 8px;
    `;

    setTimeout(() => confirmDiv.remove(), 2000);
  }

  /**
   * Toggle minimize
   */
  toggleMinimize() {
    // Validate required elements exist
    if (!this.elements.wrapper) {
      console.error('❌ Chatbot wrapper element not found');
      return;
    }

    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      this.elements.wrapper.style.display = 'none';
      
      if (this.elements.fab) {
        this.elements.fab.style.display = 'flex';
      }
      
      if (this.messageCount > 0 && this.elements.fabBadge) {
        this.elements.fabBadge.textContent = this.messageCount;
        this.elements.fabBadge.style.display = 'flex';
      }
    } else {
      this.elements.wrapper.style.display = 'flex';
      
      if (this.elements.fab) {
        this.elements.fab.style.display = 'none';
      }
      
      if (this.elements.fabBadge) {
        this.elements.fabBadge.style.display = 'none';
      }
      
      if (this.elements.input) {
        this.elements.input.focus();
      }
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    setTimeout(() => {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Get current time formatted
   */
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Show error message
   */
  showError(message) {
    this.addMessage(message, 'bot', { type: 'error' });
  }

  /**
   * Shake animation for input
   */
  shake(element) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = 'shake 0.3s ease-in-out';
    }, 10);
  }
}

// CSS for shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
`;
document.head.appendChild(style);

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📌 DOM ready, initializing chatbot...');
    window.chatbot = new ChatbotApp();
  });
} else {
  // DOM already loaded
  console.log('📌 DOM already loaded, initializing chatbot...');
  window.chatbot = new ChatbotApp();
}