// Content script - runs on all pages
console.log('[Content Script] Conversation Extractor Running');

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content Script] Message received:', request);

  if (request.action === 'extract') {
    // Wait for React hydration before extracting
    setTimeout(() => {
      try {
        let conversation = null;

        // Detect platform and extract
        if (window.location.hostname.includes('gemini.google.com')) {
          conversation = extractConversation();
        } else if (window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')) {
          // TODO: Add ChatGPT extractor
          console.warn('[Content Script] ChatGPT extraction not yet implemented');
        } else if (window.location.hostname.includes('claude.ai')) {
          // TODO: Add Claude extractor
          console.warn('[Content Script] Claude extraction not yet implemented');
        } else {
          console.error('[Content Script] Unsupported platform');
        }

        if (conversation) {
          console.log('[Content Script] Extraction successful:', conversation);
          sendResponse({ success: true, conversation: conversation });
        } else {
          sendResponse({ success: false, error: 'No conversation extracted' });
        }
      } catch (error) {
        console.error('[Content Script] Extraction failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    }, 3000); // Wait 3 seconds for React to hydrate

    // Return true to indicate we'll send response asynchronously
    return true;
  }
});
