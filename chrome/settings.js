/**
 * Settings Page Controller
 * Manages API key storage and TTS model configuration
 */

const apiKeyInput = document.getElementById('api-key');
const ttsModelSelect = document.getElementById('tts-model');
const storageTypeSelect = document.getElementById('storage-type');
const storageWarningEl = document.getElementById('storage-warning');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const backBtn = document.getElementById('back-btn');
const statusMessageEl = document.getElementById('status-message');
const apiKeyStatusEl = document.getElementById('api-key-status');

let currentStorageType = 'local'; // Track current storage type

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

  if (settings.storageType) {
    storageTypeSelect.value = settings.storageType;
    currentStorageType = settings.storageType;
  }

  // Set up event listeners
  saveBtn.addEventListener('click', handleSave);
  testBtn.addEventListener('click', handleTest);
  backBtn.addEventListener('click', () => window.close());

  // Auto-save on change
  apiKeyInput.addEventListener('change', handleSave);
  ttsModelSelect.addEventListener('change', handleSave);

  // Storage type change handler
  storageTypeSelect.addEventListener('change', handleStorageTypeChange);
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  return new Promise((resolve) => {
    // First check which storage type is configured
    chrome.storage.local.get(['storageType'], (result) => {
      const storageType = result.storageType || 'local';
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;

      storage.get(['apiKey', 'ttsModel', 'storageType'], (result) => {
        resolve({
          apiKey: result.apiKey || '',
          ttsModel: result.ttsModel || 'tts-1',
          storageType: result.storageType || 'local'
        });
      });
    });
  });
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    const storageType = settings.storageType || currentStorageType;
    const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;

    // Always save storageType to local so we know where to look
    chrome.storage.local.set({ storageType }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // Save other settings to the chosen storage
      storage.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Handle save button click
 */
async function handleSave() {
  const apiKey = apiKeyInput.value.trim();
  const ttsModel = ttsModelSelect.value;
  const storageType = storageTypeSelect.value;

  if (!apiKey) {
    showStatus('API key is required', 'error');
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showStatus('Invalid API key format. Should start with "sk-"', 'error');
    return;
  }

  try {
    await saveSettings({ apiKey, ttsModel, storageType });
    currentStorageType = storageType;
    showStatus(`Settings saved successfully (${storageType} storage)`, 'success');
    showAPIKeyStatus('saved');
    console.log(`[Settings] Saved successfully to ${storageType} storage`);
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

/**
 * Handle storage type change
 */
function handleStorageTypeChange() {
  const newStorageType = storageTypeSelect.value;

  if (newStorageType !== currentStorageType && apiKeyInput.value.trim()) {
    storageWarningEl.style.display = 'block';
    showStatus('Storage type changed. Click Save to apply.', 'info');
  } else {
    storageWarningEl.style.display = 'none';
  }
}

// Initialize when page loads
init();
