/**
 * Markdown Exporter
 * Converts conversation objects to clean, readable markdown format
 */

/**
 * Exports a conversation to markdown format
 * @param {Object} conversation - Conversation object from conversationModel
 * @param {Object} options - Export options
 * @returns {string} Markdown formatted conversation
 */
function exportToMarkdown(conversation, options = {}) {
  const {
    includeMetadata = false,
    includeVoiceProfiles = true,
    includeTimestamps = false,
    separatorStyle = 'line' // 'line', 'block', or 'minimal'
  } = options;

  let markdown = '';

  // Header
  markdown += `# ${conversation.title}\n\n`;

  // Metadata section
  if (includeMetadata) {
    markdown += `**Platform:** ${conversation.platform}  \n`;
    markdown += `**Created:** ${new Date(conversation.created).toLocaleString()}  \n`;
    markdown += `**Exchanges:** ${conversation.exchanges.length}  \n`;
    markdown += `\n---\n\n`;
  }

  // Participants section
  if (includeVoiceProfiles && conversation.participants) {
    markdown += `## Participants\n\n`;
    conversation.participants.forEach(participant => {
      markdown += `- **${participant.name}** (${participant.type})`;
      if (participant.voiceProfile) {
        const vp = participant.voiceProfile;
        markdown += ` - Voice: ${vp.voice || 'default'}, Speed: ${vp.speed || 1.0}`;
      }
      markdown += `\n`;
    });
    markdown += `\n---\n\n`;
  }

  // Exchanges
  markdown += `## Conversation\n\n`;

  conversation.exchanges.forEach((exchange, index) => {
    const participant = conversation.participants.find(p => p.id === exchange.participantId);
    const participantName = participant ? participant.name : 'Unknown';
    const isUser = exchange.role === 'user';

    // Separator between exchanges
    if (index > 0) {
      if (separatorStyle === 'line') {
        markdown += `\n---\n\n`;
      } else if (separatorStyle === 'block') {
        markdown += `\n\n`;
      } else {
        markdown += `\n`;
      }
    }

    // Exchange header
    markdown += `### ${participantName}`;

    if (includeTimestamps && exchange.timestamp) {
      const time = new Date(exchange.timestamp).toLocaleTimeString();
      markdown += ` _(${time})_`;
    }

    markdown += `\n\n`;

    // Exchange content
    markdown += `${exchange.text}\n`;

    // Audio indicator
    if (exchange.audioUrl) {
      markdown += `\n_[Audio available]_\n`;
    }
  });

  // Footer metadata
  if (includeMetadata) {
    markdown += `\n---\n\n`;
    markdown += `_Exported: ${new Date().toLocaleString()}_  \n`;
    markdown += `_Conversation ID: ${conversation.id}_\n`;
  }

  return markdown;
}

/**
 * Downloads markdown content as a file
 * @param {string} markdown - Markdown content
 * @param {string} filename - Filename for download
 */
function downloadMarkdown(markdown, filename = 'conversation.md') {
  const blob = new Blob([markdown], { type: 'text/markdown' });
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
 * Generates a safe filename from conversation title
 * @param {Object} conversation - Conversation object
 * @returns {string} Safe filename
 */
function generateMarkdownFilename(conversation) {
  const title = conversation.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date(conversation.created).toISOString().split('T')[0];
  return `${date}-${title}.md`;
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    exportToMarkdown,
    downloadMarkdown,
    generateMarkdownFilename
  };
}
