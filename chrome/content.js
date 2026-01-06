// content.js
console.log('Conversation Extractor Content Script Running');

// Extract all text from the page
function extractPageText() {
    const allText = document.body.innerText;
    console.log('Extracted Text:', allText);
    return allText;
}

// Run extraction when the page loads
window.addEventListener('load', () => {
    extractPageText();
});
