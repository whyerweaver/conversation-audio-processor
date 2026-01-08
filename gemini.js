/**
 * GEMINI EXTRACTOR - Version 2026-01
 * With timing fix for React hydration
 */

console.log('[Gemini Extractor] Script loaded');

/**
 * Main extraction function
 */
function extractGeminiConversation() {
  console.log('[Gemini Extractor] Starting extraction...');
  
  const conversation = createConversation('Gemini Conversation', 'gemini');
  
  try {
    // Direct approach:  find all message-content elements
    const messages = document.querySelectorAll('message-content');
    console.log(`[Gemini Extractor] Found ${messages. length} message elements`);
    
    if (messages.length === 0) {
      console.error('[Gemini Extractor] No messages found');
      return conversation;
    }
    
    // Extract each message
    messages.forEach((msgElement, index) => {
      try {
        const text = msgElement.innerText. trim();
        
        if (text && text.length > 5) {
          const role = index % 2 === 0 ? 'user' : 'assistant';
          
          const exchange = {
            participantId:  role === 'user' ? 'user-me' : 'llm-gemini',
            role: role,
            text:  text,
            timestamp: new Date().toISOString(),
            metadata: {
              platform: 'gemini',
              extractedIndex: index
            }
          };
          
          addExchange(conversation, exchange);
          console.log(`[Gemini Extractor] Extracted:  ${role} - ${text.substring(0, 50)}...`);
        }
      } catch (error) {
        console.warn(`[Gemini Extractor] Failed to extract message ${index}:`, error);
      }
    });
    
    console.log(`[Gemini Extractor] Complete: ${conversation.exchanges.length} exchanges`);
    
  } catch (error) {
    console.error('[Gemini Extractor] Extraction failed:', error);
  }
  
  return conversation;
}

/**
 * Public API
 */
function extractConversation() {
  return extractGeminiConversation();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractConversation,
    extractGeminiConversation
  };
}

console. log('[Gemini Extractor] Ready');