import React from 'react';
import { Sparkles, Key, MessageSquare, Send, Users } from 'lucide-react';

export default function ChatDrawer({
  geminiApiKey,
  setShowKeyModal,
  auraAutoReply,
  setAuraAutoReply,
  handleTriggerAuraPrompt,
  messages,
  myName,
  isAuraThinking,
  chatBottomRef,
  chatInput,
  setChatInput,
  chatInputRef,
  handleChatInputChange,
  handleChatKeyDown,
  insertMention,
  mentionQuery,
  setMentionQuery,
  filteredMentions,
  mentionSelectedIndex,
  handleSendMessage,
  renderMessageContent,
}) {
  return (
    <div className="drawer-body chat-drawer-body">
      {/* Aura AI Copilot Control Bar */}
      <div className="aura-copilot-banner">
        <div className="aura-banner-top">
          <div className="aura-title-badge">
            <div className="aura-sparkle-icon">
              <Sparkles size={14} />
            </div>
            <span>Aura AI Copilot</span>
            <span className="aura-status-dot" title="Gemini AI Ready" />
          </div>

          <div className="aura-header-actions">
            <button
              className="aura-key-btn"
              onClick={() => setShowKeyModal(true)}
              title="Set custom Gemini API Key"
            >
              <Key size={12} />
              <span>{geminiApiKey ? 'API Key Active' : 'Set Key'}</span>
            </button>

            <label
              className="aura-auto-reply-toggle"
              title="When enabled, Aura AI automatically answers questions in chat"
            >
              <span>Auto</span>
              <div
                className={`aura-switch ${auraAutoReply ? 'active' : ''}`}
                onClick={() => setAuraAutoReply(!auraAutoReply)}
              >
                <div className="aura-switch-thumb" />
              </div>
            </label>
          </div>
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="aura-prompt-chips">
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Summarize what was discussed')}
          >
            ✨ Summarize
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura What are our key action items?')}
          >
            📋 Action Items
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Suggest ideas for this topic')}
          >
            💡 Brainstorm
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Give a quick meeting tip')}
          >
            🤖 Quick Tip
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="drawer-empty-state">
            <MessageSquare size={32} opacity={0.3} />
            <p>No messages yet.</p>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Say hello or ask <strong>@aura</strong> anything!
            </span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isAi = msg.isAi || msg.senderName === 'Aura AI';
            const isMe = msg.senderName === myName;

            return (
              <div
                key={msg._id || i}
                className={`chat-message-bubble ${
                  isAi ? 'ai-message' : isMe ? 'my-message' : ''
                }`}
              >
                <div className="chat-message-meta">
                  <span className="chat-sender-name">
                    {isAi ? (
                      <span className="ai-badge-tag">
                        <Sparkles size={11} /> Aura AI (Gemini)
                      </span>
                    ) : (
                      msg.senderName
                    )}
                  </span>
                  <span className="chat-time">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'now'}
                  </span>
                </div>
                <p className="chat-message-text" style={{ whiteSpace: 'pre-line' }}>
                  {renderMessageContent(msg.content)}
                </p>
              </div>
            );
          })
        )}

        {/* Aura AI Thinking indicator */}
        {isAuraThinking && (
          <div className="aura-thinking-bubble">
            <Sparkles size={14} />
            <span>Aura AI is thinking with Gemini...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input Area with @Mention Popup */}
      <div className="chat-composer-wrapper">
        {/* @Mention Autocomplete Dropdown Popup */}
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <div className="mention-popup-box">
            <div className="mention-popup-header">
              <span>Mention in meeting (@)</span>
            </div>
            <div className="mention-popup-list">
              {filteredMentions.map((cand, idx) => (
                <button
                  key={cand.id}
                  type="button"
                  className={`mention-item-row ${
                    idx === mentionSelectedIndex ? 'selected' : ''
                  }`}
                  onClick={() => insertMention(cand)}
                >
                  <div className="mention-item-avatar">
                    {cand.isAi ? (
                      <Sparkles size={13} color="#c084fc" />
                    ) : cand.isEveryone ? (
                      <Users size={13} color="#f59e0b" />
                    ) : (
                      cand.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="mention-item-info">
                    <span className="mention-item-name">{cand.name}</span>
                    <span className="mention-item-handle">{cand.mentionText}</span>
                  </div>
                  <span className="mention-item-role">
                    {cand.description || cand.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input Form */}
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="chat-input-wrapper">
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Send a message to everyone (type @ to mention)..."
              className="chat-text-input"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyDown={handleChatKeyDown}
            />
            <button
              type="button"
              className="chat-at-btn"
              onClick={() => {
                setChatInput((prev) => (prev ? `${prev} @` : '@'));
                setMentionQuery('');
                if (chatInputRef.current) chatInputRef.current.focus();
              }}
              title="Mention someone (@)"
            >
              @
            </button>
          </div>
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="chat-send-btn"
            title="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
