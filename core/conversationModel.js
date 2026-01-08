// conversationModel.js
// Core data structure for conversations across all LLM platforms

/**
 * Creates a new conversation object
 * @param {string} title - Conversation title
 * @param {string} platform - Source platform (gemini, chatgpt, claude, etc.)
 * @returns {Object} Conversation object
 */
function createConversation(title = "Untitled Conversation", platform = "unknown") {
  return {
    // Metadata
    id: generateUUID(),
    title: title,
    platform: platform,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    
    // Participants
    participants: [
      {
        id: "user-me",
        type: "human",
        name: "User",
        role: "user"
      },
      {
        id: `llm-${platform}`,
        type: "llm",
        name: capitalizeFirst(platform),
        platform: platform,
        voiceProfile: null // Will be populated from voiceProfiles.js
      }
    ],
    
    // Conversation exchanges
    exchanges: [],
    
    // Export configuration
    exportConfig: {
      format: "html",
      includeAudio: true,
      includeMetadata: false,
      theme: "light"
    }
  };
}

/**
 * Adds an exchange to the conversation
 * @param {Object} conversation - Conversation object
 * @param {Object} exchange - Exchange data
 * @returns {Object} Updated conversation
 */
function addExchange(conversation, exchange) {
  const newExchange = {
    id: `exchange-${conversation.exchanges.length + 1}`,
    timestamp: exchange.timestamp || new Date().toISOString(),
    participantId: exchange.participantId,
    role: exchange.role, // 'user' or 'assistant'
    text: exchange.text,
    audioUrl: exchange.audioUrl || null,
    audioGenerated: exchange.audioUrl ? new Date().toISOString() : null,
    metadata: exchange.metadata || {}
  };
  
  conversation.exchanges.push(newExchange);
  conversation.updated = new Date().toISOString();
  
  return conversation;
}

/**
 * Gets the last exchange in the conversation
 * @param {Object} conversation - Conversation object
 * @returns {Object|null} Last exchange or null
 */
function getLastExchange(conversation) {
  if (conversation.exchanges.length === 0) return null;
  return conversation.exchanges[conversation.exchanges.length - 1];
}

/**
 * Gets all exchanges by a specific participant
 * @param {Object} conversation - Conversation object
 * @param {string} participantId - Participant ID
 * @returns {Array} Array of exchanges
 */
function getExchangesByParticipant(conversation, participantId) {
  return conversation.exchanges.filter(ex => ex.participantId === participantId);
}

/**
 * Simple UUID generator (v4)
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Capitalizes first letter of string
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export functions for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createConversation,
    addExchange,
    getLastExchange,
    getExchangesByParticipant
  };
}
