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
    // Get both user queries and assistant responses
    const userQueries = document.querySelectorAll('user-query');
    const assistantResponses = document.querySelectorAll('message-content');

    console.log(`[Gemini Extractor] Found ${userQueries.length} user queries and ${assistantResponses.length} assistant responses`);

    if (userQueries.length === 0 && assistantResponses.length === 0) {
      console.error('[Gemini Extractor] No messages found');
      return conversation;
    }

    // Interleave user queries and assistant responses
    const maxLength = Math.max(userQueries.length, assistantResponses.length);

    for (let i = 0; i < maxLength; i++) {
      // Add user query
      if (i < userQueries.length) {
        try {
          const text = userQueries[i].innerText.trim();

          if (text && text.length > 5) {
            const exchange = {
              participantId: 'user-me',
              role: 'user',
              text: text,
              timestamp: new Date().toISOString(),
              metadata: {
                platform: 'gemini',
                extractedIndex: i * 2
              }
            };

            addExchange(conversation, exchange);
            console.log(`[Gemini Extractor] Extracted user query ${i}: ${text.substring(0, 50)}...`);
          }
        } catch (error) {
          console.warn(`[Gemini Extractor] Failed to extract user query ${i}:`, error);
        }
      }

      // Add assistant response
      if (i < assistantResponses.length) {
        try {
          const text = assistantResponses[i].innerText.trim();

          if (text && text.length > 5) {
            const exchange = {
              participantId: 'llm-gemini',
              role: 'assistant',
              text: text,
              timestamp: new Date().toISOString(),
              metadata: {
                platform: 'gemini',
                extractedIndex: i * 2 + 1
              }
            };

            addExchange(conversation, exchange);
            console.log(`[Gemini Extractor] Extracted assistant response ${i}: ${text.substring(0, 50)}...`);
          }
        } catch (error) {
          console.warn(`[Gemini Extractor] Failed to extract assistant response ${i}:`, error);
        }
      }
    }

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