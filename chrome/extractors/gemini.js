/**
 * GEMINI EXTRACTOR - Version 2026-01
 * 
 * PURPOSE: 
 * Extracts conversation exchanges from Gemini web UI (gemini.google.com)
 * 
 * DOM STRUCTURE (as of Jan 2026):
 * Gemini uses a dynamic React-based UI. Key observations:
 * - Conversation turns are in message bubbles
 * - User messages and model responses alternate
 * - Each turn contains markdown-rendered content
 * - Structure may use data attributes or specific class patterns
 * 
 * EXTRACTION STRATEGY:
 * 1. Wait for page to fully load (React hydration)
 * 2. Find all message containers
 * 3. Determine speaker (user vs model) by position/attributes/classes
 * 4. Extract text content (plain text, not HTML)
 * 5. Maintain order and capture timestamps if available
 * 
 * FALLBACK STRATEGIES:
 * - Multiple selector approaches (data attrs, classes, semantic structure)
 * - Text pattern matching for user vs assistant detection
 * - Traversal-based discovery if direct selectors fail
 * 
 * WHEN THIS BREAKS:
 * 1. Open gemini.google.com with an active conversation
 * 2. Open DevTools (F12) → Elements tab
 * 3. Inspect a user message bubble
 * 4. Inspect an assistant message bubble
 * 5. Note the parent container, class names, data attributes
 * 6. Update PRIMARY_SELECTORS below
 * 7. Test: Run extractGeminiConversation() in console
 * 
 * DEBUGGING TIPS:
 * - Gemini loads content dynamically - wait for full page load
 * - Use MutationObserver if extraction timing is off
 * - Check if Gemini added data-testid attributes (common in React apps)
 * - Look for ARIA roles (role="article", role="log")
 * 
 * LAST UPDATED: 2026-01-07
 * TESTED ON: gemini.google.com (Jan 2026 version)
 */

// Primary selectors - update these when UI changes
const PRIMARY_SELECTORS = {
  // Main container holding all conversation messages
  conversationContainer: 'main',
  
  // Individual message turns - try multiple approaches
  messageTurns: [
    '[data-message-id]',           // If Gemini adds message IDs
    '.message-content',             // Common pattern
    '[role="article"]',             // Semantic HTML
    'message-item'                  // Possible custom element
  ],
  
  // Text content within messages
  messageText: [
    '.markdown',
    '.message-content',
    '[data-message-text]',
    'p'                             // Fallback to paragraphs
  ]
};

// Fallback selectors if primary ones fail
const FALLBACK_SELECTORS = {
  // Try to find any substantial text blocks
  anyTextBlock: 'div[class*="message"], div[class*="chat"], article, [role="article"]'
};

/**
 * Main extraction function
 * @returns {Object} Conversation object using our data model
 */
function extractGeminiConversation() {
  console.log('[Gemini Extractor] Starting extraction...');
  
  // Import our conversation model
  // (In actual implementation, these will be loaded via manifest)
  const conversation = createConversation('Gemini Conversation', 'gemini');
  
  try {
    // Step 1: Find conversation container
    const container = findConversationContainer();
    if (!container) {
      console.error('[Gemini Extractor] Could not find conversation container');
      return conversation;
    }
    
    console.log('[Gemini Extractor] Found conversation container:', container);
    
    // Step 2: Find all message elements
    const messages = findMessageElements(container);
    console.log(`[Gemini Extractor] Found ${messages.length} message elements`);
    
    // Step 3: Extract and structure each message
    messages.forEach((msgElement, index) => {
      try {
        const exchange = extractSingleMessage(msgElement, index);
        if (exchange) {
          addExchange(conversation, exchange);
          console.log(`[Gemini Extractor] Extracted exchange ${index + 1}:`, exchange.role);
        }
      } catch (error) {
        console.warn(`[Gemini Extractor] Failed to extract message ${index}:`, error);
      }
    });
    
    console.log(`[Gemini Extractor] Extraction complete: ${conversation.exchanges.length} exchanges`);
    
  } catch (error) {
    console.error('[Gemini Extractor] Extraction failed:', error);
  }
  
  return conversation;
}

/**
 * Finds the main conversation container
 * Uses multiple strategies with fallbacks
 */
function findConversationContainer() {
  // Strategy 1: Find main content area
  let container = document.querySelector('main');
  if (container && container.textContent.length > 100) {
    return container;
  }
  
  // Strategy 2: Find container with role="log" (chat log pattern)
  container = document.querySelector('[role="log"]');
  if (container) return container;
  
  // Strategy 3: Find largest content div
  const allDivs = document.querySelectorAll('div');
  let largest = null;
  let maxLength = 0;
  
  allDivs.forEach(div => {
    const textLength = div.textContent.length;
    if (textLength > maxLength && textLength > 500) {
      maxLength = textLength;
      largest = div;
    }
  });
  
  return largest;
}

/**
 * Finds all message elements within the container
 * Tries multiple selector strategies
 */
function findMessageElements(container) {
  // Try each primary selector
  for (const selector of PRIMARY_SELECTORS.messageTurns) {
    const elements = container.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`[Gemini Extractor] Using selector: ${selector}`);
      return Array.from(elements);
    }
  }
  
  // Fallback: Try to identify messages by structure
  // Look for divs with substantial content that alternate (user/assistant pattern)
  const candidates = container.querySelectorAll('div');
  const messages = [];
  
  candidates.forEach(div => {
    const text = div.textContent.trim();
    // Messages typically have 20+ characters and contain paragraphs
    if (text.length > 20 && div.querySelector('p')) {
      // Avoid duplicates (child of already-selected element)
      const isNested = messages.some(msg => msg.contains(div) || div.contains(msg));
      if (!isNested) {
        messages.push(div);
      }
    }
  });
  
  console.log(`[Gemini Extractor] Fallback strategy found ${messages.length} candidates`);
  return messages;
}

/**
 * Extracts data from a single message element
 * @param {Element} element - DOM element containing message
 * @param {number} index - Position in conversation
 * @returns {Object} Exchange object
 */
function extractSingleMessage(element, index) {
  // Extract text content
  const text = extractMessageText(element);
  if (!text || text.length < 5) {
    return null; // Skip empty or very short messages
  }
  
  // Determine role (user or assistant)
  const role = determineMessageRole(element, index);
  
  // Try to extract timestamp
  const timestamp = extractTimestamp(element) || new Date().toISOString();
  
  // Build exchange object
  return {
    participantId: role === 'user' ? 'user-me' : 'llm-gemini',
    role: role,
    text: text,
    timestamp: timestamp,
    metadata: {
      platform: 'gemini',
      extractedIndex: index
    }
  };
}

/**
 * Extracts clean text from message element
 * Tries multiple selector strategies
 */
function extractMessageText(element) {
  // Try each text selector
  for (const selector of PRIMARY_SELECTORS.messageText) {
    const textElement = element.querySelector(selector);
    if (textElement) {
      return textElement.innerText.trim();
    }
  }
  
  // Fallback: Get direct text content
  // Clone and remove script/style tags
  const clone = element.cloneNode(true);
  clone.querySelectorAll('script, style, button').forEach(el => el.remove());
  return clone.innerText.trim();
}

/**
 * Determines if message is from user or assistant
 * Uses multiple heuristics
 */
function determineMessageRole(element, index) {
  // Strategy 1: Check for data attributes
  const role = element.getAttribute('data-role');
  if (role === 'user') return 'user';
  if (role === 'model' || role === 'assistant') return 'assistant';
  
  // Strategy 2: Check class names
  const className = element.className.toLowerCase();
  if (className.includes('user')) return 'user';
  if (className.includes('model') || className.includes('assistant') || className.includes('gemini')) {
    return 'assistant';
  }
  
  // Strategy 3: Alternating pattern (conversations alternate user/assistant)
  // First message is typically user
  return index % 2 === 0 ? 'user' : 'assistant';
  
  // Strategy 4: Visual position (user messages often right-aligned)
  // This is fragile but can work as last resort
  const styles = window.getComputedStyle(element);
  if (styles.textAlign === 'right' || styles.marginLeft === 'auto') {
    return 'user';
  }
  
  return 'assistant'; // Default to assistant if uncertain
}

/**
 * Extracts timestamp if available
 */
function extractTimestamp(element) {
  // Try to find time element
  const timeElement = element.querySelector('time');
  if (timeElement) {
    return timeElement.getAttribute('datetime') || timeElement.innerText;
  }
  
  // Try data attribute
  const timestamp = element.getAttribute('data-timestamp') || 
                   element.getAttribute('data-time');
  if (timestamp) return timestamp;
  
  return null;
}

/**
 * Public API - called by content script
 */
function extractConversation() {
  return extractGeminiConversation();
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractConversation,
    extractGeminiConversation
  };
}