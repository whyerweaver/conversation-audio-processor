/**
 * Settings Page Controller
 * Manages API key storage and TTS model configuration
 */

const apiKeyInput = document.getElementById('api-key');
const ttsModelSelect = document.getElementById('tts-model');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const backBtn = document.getElementById('back-btn');
const statusMessageEl = document.getElementById('status-message');
const apiKeyStatusEl = document.getElementById('api-key-status');

/**
 * Initialize settings page
 */
async function init() {
  console.log('[Settings] Initializing...');

  // Load saved settings
  const settings = await loadSettings();

  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
    showAPIKeyStatus('saved');
  }

  if (settings.ttsModel) {
    ttsModelSelect.value = settings.ttsModel;
  }

  // Set up event listeners
  saveBtn.addEventListener('click', handleSave);
  testBtn.addEventListener('click', handleTest);
  backBtn.addEventListener('click', () => window.close());

  // Auto-save on change
  apiKeyInput.addEventListener('change', handleSave);
  ttsModelSelect.addEventListener('change', handleSave);
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'ttsModel'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        ttsModel: result.ttsModel || 'tts-1'
      });
    });
  });
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Handle save button click
 */
async function handleSave() {
  const apiKey = apiKeyInput.value.trim();
  const ttsModel = ttsModelSelect.value;

  if (!apiKey) {
    showStatus('API key is required', 'error');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showStatus('Invalid API key format. Should start with "sk-"', 'error');
    return;
  }

  try {
    await saveSettings({ apiKey, ttsModel });
    showStatus('Settings saved successfully', 'success');
    showAPIKeyStatus('saved');
    console.log('[Settings] Saved successfully');
  } catch (error) {
    console.error('[Settings] Save failed:', error);
    showStatus(`Failed to save: ${error.message}`, 'error');
  }
}

/**
 * Handle test button click
 */
async function handleTest() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showStatus('Please enter an API key first', 'error');
    return;
  }

  testBtn.disabled = true;
  testBtn.querySelector('.btn-text').textContent = 'Testing...';
  showStatus('Testing API key...', 'info');

  try {
    // Test with a short phrase
    const testText = 'Testing OpenAI TTS connection.';
    await generateAudio(testText, 'llm-gemini', apiKey);

    showStatus('API key is valid and working!', 'success');
    showAPIKeyStatus('valid');
  } catch (error) {
    console.error('[Settings] Test failed:', error);
    showStatus(`Test failed: ${error.message}`, 'error');
    showAPIKeyStatus('invalid');
  } finally {
    testBtn.disabled = false;
    testBtn.querySelector('.btn-text').textContent = 'Test API Key';
  }
}

/**
 * Show API key status indicator
 */
function showAPIKeyStatus(status) {
  let html = '';

  if (status === 'saved') {
    html = '<div class="status-indicator info">✓ API key saved locally</div>';
  } else if (status === 'valid') {
    html = '<div class="status-indicator success">✓ API key is valid</div>';
  } else if (status === 'invalid') {
    html = '<div class="status-indicator error">✗ API key is invalid</div>';
  }

  apiKeyStatusEl.innerHTML = html;
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

// Initialize when page loads
init();
