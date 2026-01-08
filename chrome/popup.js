/**
 * Popup UI Controller
 * Handles user interactions and communicates with content scripts
 */

let currentConversation = null;

// DOM Elements
const platformNameEl = document.getElementById('platform-name');
const extractBtn = document.getElementById('extract-btn');
const resultsSection = document.getElementById('results-section');
const exchangeCountEl = document.getElementById('exchange-count');
const statusMessageEl = document.getElementById('status-message');
const settingsBtn = document.getElementById('settings-btn');

// Progress elements
const audioProgressSection = document.getElementById('audio-progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const progressDetails = document.getElementById('progress-details');

// Export buttons
const exportMdBtn = document.getElementById('export-md-btn');
const exportHtmlBtn = document.getElementById('export-html-btn');
const exportJsonBtn = document.getElementById('export-json-btn');

/**
 * Initialize popup
 */
async function init() {
  console.log('[Popup] Initializing...');

  // Detect current platform
  const platform = await detectPlatform();
  updatePlatformStatus(platform);

  // Set up event listeners
  extractBtn.addEventListener('click', handleExtraction);
  exportMdBtn.addEventListener('click', () => handleExport('markdown'));
  exportHtmlBtn.addEventListener('click', () => handleExport('html'));
  exportJsonBtn.addEventListener('click', () => handleExport('json'));
  settingsBtn.addEventListener('click', openSettings);
}

/**
 * Open settings page in new tab
 */
function openSettings() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('chrome/settings.html')
  });
}

/**
 * Detect which LLM platform we're on
 */
async function detectPlatform() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        resolve('unknown');
        return;
      }

      const url = tabs[0].url;

      if (url.includes('gemini.google.com')) {
        resolve('gemini');
      } else if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
        resolve('chatgpt');
      } else if (url.includes('claude.ai')) {
        resolve('claude');
      } else if (url.includes('x.com/i/grok')) {
        resolve('grok');
      } else if (url.includes('deepseek.com')) {
        resolve('deepseek');
      } else {
        resolve('unknown');
      }
    });
  });
}

/**
 * Update platform status display
 */
function updatePlatformStatus(platform) {
  if (platform === 'unknown') {
    platformNameEl.textContent = 'Not Supported';
    platformNameEl.classList.add('unknown');
    extractBtn.disabled = true;
    showStatus('This page is not a supported LLM platform', 'error');
  } else {
    platformNameEl.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
    platformNameEl.classList.add('detected');
    extractBtn.disabled = false;
  }
}

/**
 * Handle extraction button click
 */
async function handleExtraction() {
  console.log('[Popup] Extraction requested');

  extractBtn.disabled = true;
  extractBtn.querySelector('.btn-text').textContent = 'Extracting...';

  try {
    // Send message to content script to extract conversation
    const response = await sendMessageToContentScript({ action: 'extract' });

    if (response && response.conversation) {
      currentConversation = response.conversation;
      displayResults(currentConversation);
      showStatus('Extraction successful!', 'success');
    } else {
      throw new Error('No conversation data received');
    }
  } catch (error) {
    console.error('[Popup] Extraction failed:', error);
    showStatus('Extraction failed. Try reloading the page.', 'error');
  } finally {
    extractBtn.disabled = false;
    extractBtn.querySelector('.btn-text').textContent = 'Extract Conversation';
  }
}

/**
 * Send message to content script
 */
function sendMessageToContentScript(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab'));
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  });
}

/**
 * Display extraction results
 */
function displayResults(conversation) {
  const count = conversation.exchanges.length;
  exchangeCountEl.textContent = `${count} exchange${count !== 1 ? 's' : ''} extracted`;
  resultsSection.classList.remove('hidden');
}

/**
 * Handle export to different formats
 */
function handleExport(format) {
  if (!currentConversation) {
    showStatus('No conversation to export', 'error');
    return;
  }

  console.log(`[Popup] Exporting as ${format}`);

  try {
    switch (format) {
      case 'markdown':
        exportAsMarkdown();
        break;
      case 'html':
        exportAsHTML();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
    showStatus(`Exported as ${format.toUpperCase()}`, 'success');
  } catch (error) {
    console.error('[Popup] Export failed:', error);
    showStatus(`Export failed: ${error.message}`, 'error');
  }
}

/**
 * Export as Markdown
 */
function exportAsMarkdown() {
  const markdown = exportToMarkdown(currentConversation, {
    includeMetadata: true,
    includeVoiceProfiles: true,
    includeTimestamps: true,
    separatorStyle: 'line'
  });

  const filename = generateMarkdownFilename(currentConversation);
  downloadMarkdown(markdown, filename);
}

/**
 * Export as HTML with audio playback
 */
async function exportAsHTML() {
  try {
    // Load API key from storage
    const settings = await loadSettings();

    if (!settings.apiKey) {
      showStatus('Please configure your OpenAI API key in Settings first', 'error');
      return;
    }

    // Show progress section
    audioProgressSection.classList.remove('hidden');
    exportHtmlBtn.disabled = true;

    // Generate audio for all exchanges
    const conversationWithAudio = await generateAllAudio(
      currentConversation,
      settings.apiKey,
      (progress) => {
        if (progress.phase === 'generating') {
          const percentage = progress.percentage || 0;
          progressFill.style.width = `${percentage}%`;
          progressText.textContent = `${percentage}% complete`;
          progressDetails.textContent = `Exchange ${progress.current + 1}/${progress.total} • ${progress.totalCharacters} chars • $${progress.estimatedCost.toFixed(4)}`;
        } else if (progress.phase === 'complete') {
          progressFill.style.width = '100%';
          progressText.textContent = '100% complete';
          progressDetails.textContent = `Generated ${progress.total} audio files • ${progress.totalCharacters} chars • $${progress.totalCost.toFixed(4)}`;
        } else if (progress.phase === 'error') {
          showStatus(`Audio generation error: ${progress.error}`, 'error');
        }
      }
    );

    // Update current conversation with audio
    currentConversation = conversationWithAudio;

    // Generate HTML with embedded audio
    const html = exportToHTML(currentConversation, {
      includeMetadata: true,
      theme: 'light',
      autoPlay: false,
      showControls: true
    });

    const filename = currentConversation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
    downloadHTML(html, filename);

    showStatus('HTML exported with embedded OpenAI TTS audio!', 'success');

  } catch (error) {
    console.error('[Popup] HTML export with audio failed:', error);
    showStatus(`Export failed: ${error.message}`, 'error');
  } finally {
    // Hide progress and re-enable button
    setTimeout(() => {
      audioProgressSection.classList.add('hidden');
      exportHtmlBtn.disabled = false;
    }, 2000);
  }
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['storageType'], (result) => {
      const storageType = result.storageType || 'local';
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;

      storage.get(['apiKey', 'ttsModel'], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          ttsModel: result.ttsModel || 'tts-1'
        });
      });
    });
  });
}

/**
 * Export as JSON
 */
function exportAsJSON() {
  const json = JSON.stringify(currentConversation, null, 2);
  const filename = `conversation-${currentConversation.platform}-${Date.now()}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Generate basic HTML (temporary until full HTML exporter is built)
 */
function generateBasicHTML(conversation) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #2d3748; }
    .exchange { margin: 30px 0; padding: 20px; border-radius: 8px; }
    .user { background: #e6f7ff; }
    .assistant { background: #f7fafc; }
    .speaker { font-weight: 600; margin-bottom: 10px; color: #4a5568; }
    .text { line-height: 1.6; color: #2d3748; }
  </style>
</head>
<body>
  <h1>${conversation.title}</h1>
  <p><strong>Platform:</strong> ${conversation.platform}</p>
  <hr>
`;

  conversation.exchanges.forEach(exchange => {
    const participant = conversation.participants.find(p => p.id === exchange.participantId);
    const name = participant ? participant.name : 'Unknown';

    html += `
  <div class="exchange ${exchange.role}">
    <div class="speaker">${name}</div>
    <div class="text">${exchange.text}</div>
  </div>
`;
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  statusMessageEl.textContent = message;
  statusMessageEl.className = `status-message ${type}`;

  setTimeout(() => {
    statusMessageEl.classList.add('hidden');
  }, 3000);
}

// Initialize when popup opens
init();
