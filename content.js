// Content script - runs on all pages
console. log('Conversation Extractor Content Script Running');

// Wait for page to fully load (React hydration)
setTimeout(() => {
  // Check if we're on a supported platform
  if (window.location. hostname. includes('gemini.google.com')) {
    const conversation = extractConversation();
    console.log('Conversation extracted:', conversation);
  }
}, 3000);  // Wait 3 seconds for Gemini to load
