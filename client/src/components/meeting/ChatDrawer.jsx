import React from 'react';
import { Sparkles, MessageSquare, Send, Users } from 'lucide-react';

export default function ChatDrawer({
  handleTriggerAuraPrompt,
  messages,
  myName,
  isAuraThinking,
  auraError,
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
            <div className="aura-title-copy">
              <span>Aura AI</span>
              <small>Gemini-powered meeting copilot</small>
            </div>
          </div>

          <span className="aura-private-note">No API key needed</span>
        </div>

        <p className="aura-banner-copy">
          Ask anything about the conversation or get help from Aura.
        </p>
        <div className="aura-prompt-chips">
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Summarize the discussion so far')}
          >
            ✨ Summary
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Extract the action items and owners')}
          >
            📋 Action items
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura List the decisions made so far')}
          >
            ✓ Decisions
          </button>
          <button
            className="aura-chip-btn"
            onClick={() => handleTriggerAuraPrompt('@aura Brainstorm a few creative next steps')}
          >
            💡 Brainstorm
          </button>
        </div>
      </div>

      {auraError && (
        <div className="aura-error-message" role="alert">
          <Sparkles size={14} />
          <span>{auraError}</span>
        </div>
      )}

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
              placeholder="Message everyone or ask @aura anything..."
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
