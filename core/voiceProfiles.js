// voiceProfiles.js
// Voice personality configuration for each LLM platform

/**
 * Voice profiles for each LLM
 * Each LLM gets a distinct voice to create recognizable personalities
 */
const LLM_VOICE_PROFILES = {
  "gemini": {
    // Web Speech API settings
    webSpeech: {
      voice: "Google US English Female", // Fallback to first available if not found
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    // OpenAI TTS settings
    openai: {
      model: "tts-1",
      voice: "nova", // Female - friendly, energetic
      speed: 1.0
    },
    description: "Friendly, informative, energetic",
    color: "#4285F4" // Gemini blue
  },

  "chatgpt": {
    webSpeech: {
      voice: "Google UK English Female",
      rate: 1.0,
      pitch: 1.05,
      volume: 1.0
    },
    openai: {
      model: "tts-1",
      voice: "shimmer", // Female - warm, conversational
      speed: 1.0
    },
    description: "Helpful, clear, conversational",
    color: "#10A37F" // ChatGPT green
  },

  "claude": {
    webSpeech: {
      voice: "Google UK English Male",
      rate: 0.95,
      pitch: 1.05,
      volume: 1.0
    },
    openai: {
      model: "tts-1",
      voice: "fable", // Male British - thoughtful, precise
      speed: 0.95
    },
    description: "Thoughtful, precise, articulate",
    color: "#CC785C" // Claude orange
  },

  "grok": {
    webSpeech: {
      voice: "Google US English Male",
      rate: 1.1,
      pitch: 0.85,
      volume: 1.0
    },
    openai: {
      model: "tts-1",
      voice: "onyx", // Deep male - witty, direct
      speed: 1.1
    },
    description: "Witty, direct, edgy",
    color: "#000000" // X/Grok black
  },

  "deepseek": {
    webSpeech: {
      voice: "Google US English",
      rate: 0.9,
      pitch: 0.95,
      volume: 1.0
    },
    openai: {
      model: "tts-1",
      voice: "alloy", // Neutral - analytical, technical
      speed: 0.9
    },
    description: "Analytical, detailed, technical",
    color: "#1E3A8A" // Deep blue
  },

  "user-me": {
    webSpeech: {
      voice: "Google US English Male",
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    openai: {
      model: "tts-1",
      voice: "echo", // Male - clear, natural
      speed: 1.0
    },
    description: "User voice - clear, natural",
    color: "#6B7280" // Gray
  }
};

/**
 * Gets voice profile for a specific platform
 * @param {string} platform - Platform name (gemini, chatgpt, etc.)
 * @param {string} provider - TTS provider ('webspeech' or 'openai')
 * @returns {Object} Voice profile settings
 */
function getVoiceProfile(platform, provider = 'webspeech') {
  const profile = LLM_VOICE_PROFILES[platform.toLowerCase()];
  
  if (!profile) {
    console.warn(`No voice profile found for platform: ${platform}, using default`);
    return LLM_VOICE_PROFILES.gemini[provider];
  }
  
  return profile[provider];
}

/**
 * Gets all available platform names
 * @returns {Array} Array of platform names
 */
function getAvailablePlatforms() {
  return Object.keys(LLM_VOICE_PROFILES);
}

/**
 * Gets the color associated with a platform
 * @param {string} platform - Platform name
 * @returns {string} Hex color code
 */
function getPlatformColor(platform) {
  const profile = LLM_VOICE_PROFILES[platform.toLowerCase()];
  return profile ? profile.color : "#666666";
}

/**
 * Gets the description for a platform's voice
 * @param {string} platform - Platform name
 * @returns {string} Voice description
 */
function getVoiceDescription(platform) {
  const profile = LLM_VOICE_PROFILES[platform.toLowerCase()];
  return profile ? profile.description : "Default voice";
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LLM_VOICE_PROFILES,
    getVoiceProfile,
    getAvailablePlatforms,
    getPlatformColor,
    getVoiceDescription
  };
}
