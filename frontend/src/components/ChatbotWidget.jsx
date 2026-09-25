import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { aiApi } from '../services/api';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: t('chatWelcome')
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to UI
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const historyPayload = updatedMessages.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text
      }));

      const res = await aiApi.chat(userText, historyPayload, user ? user.id : null);
      setMessages([...updatedMessages, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        {
          role: 'bot',
          text: 'At InstaCoServe, 96% of service payments go straight to the verified worker with 2% welfare fund contribution and zero middleman surge pricing.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className="floating-chat-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title={t('chatTitle')}
        aria-label="Open cooperative assistant chat"
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="chat-drawer">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} color="#02C39A" />
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{t('chatTitle')}</strong>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble bot" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="form-input"
              style={{ minHeight: '38px', fontSize: '0.88rem' }}
              placeholder={t('chatPlaceholder')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !inputMessage.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
