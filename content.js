// content.js
console.log('Conversation Extractor Content Script Running');

// Run extraction when the page loads
window.addEventListener('load', () => {
    if (typeof extractGeminiConversation === 'function') {
        const conversation = extractGeminiConversation();
        console.log('Conversation extracted:', conversation);
    } else {
        console.log('Gemini extractor not loaded');
    }
});
