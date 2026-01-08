/**
 * Audio Generator - OpenAI TTS Integration
 * Generates high-quality audio from text using OpenAI's TTS API
 */

/**
 * OpenAI TTS Configuration
 */
const OPENAI_TTS_CONFIG = {
  endpoint: 'https://api.openai.com/v1/audio/speech',
  model: 'tts-1', // or 'tts-1-hd' for higher quality
  costPerCharacter: 0.000015, // $0.015 per 1K characters
  maxCharactersPerRequest: 4096
};

/**
 * Voice mapping from voiceProfiles.js to OpenAI voices
 * OpenAI voices: alloy (neutral), echo (male), fable (male British), onyx (deep male), nova (female), shimmer (female)
 */
const OPENAI_VOICE_MAP = {
  'gemini': 'nova',        // Female - friendly, energetic
  'chatgpt': 'shimmer',    // Female - warm, conversational
  'claude': 'fable',       // Male British - thoughtful, precise
  'grok': 'onyx',          // Deep male - witty, direct
  'deepseek': 'alloy',     // Neutral - analytical, technical
  'user-me': 'echo'        // Male - clear, natural (for user messages)
};

/**
 * Generate audio for a single exchange using OpenAI TTS
 * @param {string} text - Text to convert to speech
 * @param {string} participantId - ID of the participant (e.g., 'llm-gemini')
 * @param {string} apiKey - OpenAI API key
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<string>} Base64 encoded MP3 audio
 */
async function generateAudio(text, participantId, apiKey, progressCallback = null) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  if (!text || text.length === 0) {
    throw new Error('Text is required');
  }

  // Determine which OpenAI voice to use based on participant
  const platform = participantId.includes('llm-')
    ? participantId.replace('llm-', '')
    : participantId;
  const voice = OPENAI_VOICE_MAP[platform] || 'alloy';

  // Get voice profile for speed settings
  const voiceProfile = getVoiceProfile ? getVoiceProfile(platform, 'openai') : {};
  const speed = voiceProfile.speed || 1.0;

  try {
    const response = await fetch(OPENAI_TTS_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_TTS_CONFIG.model,
        input: text,
        voice: voice,
        speed: speed,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    // Convert response to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    if (progressCallback) {
      progressCallback({ success: true });
    }

    return base64;

  } catch (error) {
    console.error('[Audio Generator] Error:', error);
    if (progressCallback) {
      progressCallback({ success: false, error: error.message });
    }
    throw error;
  }
}

/**
 * Generate audio for all exchanges in a conversation (PARALLEL)
 * @param {Object} conversation - Conversation object
 * @param {string} apiKey - OpenAI API key
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Updated conversation with audio URLs
 */
async function generateAllAudio(conversation, apiKey, progressCallback = null) {
  const exchanges = conversation.exchanges.filter(ex => ex.text && ex.text.length > 0);
  const total = exchanges.length;
  let completed = 0;
  const totalCharacters = exchanges.reduce((sum, ex) => sum + ex.text.length, 0);
  const totalCost = totalCharacters * OPENAI_TTS_CONFIG.costPerCharacter;

  console.log(`[Audio Generator] Starting PARALLEL generation for ${total} exchanges`);

  // Create all promises in parallel
  const promises = exchanges.map(async (exchange, i) => {
    const characters = exchange.text.length;
    const cost = characters * OPENAI_TTS_CONFIG.costPerCharacter;

    try {
      // Generate audio
      const audioBase64 = await generateAudio(
        exchange.text,
        exchange.participantId,
        apiKey
      );

      // Store audio URL in exchange
      exchange.audioUrl = `data:audio/mp3;base64,${audioBase64}`;
      exchange.audioGenerated = new Date().toISOString();
      exchange.metadata = exchange.metadata || {};
      exchange.metadata.audioCharacters = characters;
      exchange.metadata.audioCost = cost;

      completed++;

      // Update progress
      if (progressCallback) {
        progressCallback({
          phase: 'generating',
          current: completed,
          total: total,
          currentExchange: exchange,
          totalCharacters: totalCharacters,
          estimatedCost: totalCost,
          percentage: Math.round((completed / total) * 100)
        });
      }

      console.log(`[Audio Generator] Generated audio for exchange ${completed}/${total} (${characters} chars, $${cost.toFixed(4)})`);

      return { success: true, index: i };

    } catch (error) {
      console.error(`[Audio Generator] Failed to generate audio for exchange ${i}:`, error);

      // Mark as failed
      exchange.audioUrl = null;
      exchange.metadata = exchange.metadata || {};
      exchange.metadata.audioError = error.message;

      if (progressCallback) {
        progressCallback({
          phase: 'error',
          current: completed,
          total: total,
          error: error.message
        });
      }

      return { success: false, index: i, error: error.message };
    }
  });

  // Wait for all to complete
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;

  // Final progress update
  if (progressCallback) {
    progressCallback({
      phase: 'complete',
      current: successCount,
      total: total,
      totalCharacters: totalCharacters,
      totalCost: totalCost,
      percentage: 100
    });
  }

  console.log(`[Audio Generator] Complete: ${successCount}/${total} generated, ${totalCharacters} total characters, $${totalCost.toFixed(4)} total cost`);

  return conversation;
}

/**
 * Estimate cost for a conversation
 * @param {Object} conversation - Conversation object
 * @returns {Object} Cost estimation details
 */
function estimateCost(conversation) {
  const exchanges = conversation.exchanges.filter(ex => ex.text && ex.text.length > 0);
  const totalCharacters = exchanges.reduce((sum, ex) => sum + ex.text.length, 0);
  const estimatedCost = totalCharacters * OPENAI_TTS_CONFIG.costPerCharacter;

  return {
    exchangeCount: exchanges.length,
    totalCharacters: totalCharacters,
    estimatedCost: estimatedCost,
    costFormatted: `$${estimatedCost.toFixed(4)}`
  };
}

/**
 * Convert ArrayBuffer to Base64
 * @param {ArrayBuffer} buffer - Array buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateAudio,
    generateAllAudio,
    estimateCost,
    OPENAI_TTS_CONFIG
  };
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.generateAudio = generateAudio;
  window.generateAllAudio = generateAllAudio;
  window.estimateCost = estimateCost;
}
