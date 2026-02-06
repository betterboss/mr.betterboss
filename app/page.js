'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Default Settings ───────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  botName: 'Mr. Better Boss',
  tagline: 'Your AI JobTread Sidebar',
  welcomeMessage: "Hey there! I'm Mr. Better Boss, your AI-powered JobTread sidebar. I can help with estimates, workflows, automations, client communications, and more. I search the web for the latest info too. What can I help you build today?",
  quickActions: [
    { emoji: '\u{1F4CB}', label: 'Estimate templates', prompt: 'How do I build an effective estimate template in JobTread?' },
    { emoji: '\u{2699}\uFE0F', label: 'Automate workflows', prompt: 'What are the best automations to set up with n8n and JobTread?' },
    { emoji: '\u{1F4E6}', label: 'Setup catalog', prompt: 'How do I set up my catalog and pricing in JobTread?' },
    { emoji: '\u{1F517}', label: 'Integrations', prompt: 'What integrations work with JobTread and how do I set them up?' },
    { emoji: '\u{1F680}', label: 'Faster estimates', prompt: 'How can I speed up my estimates to close more deals?' },
    { emoji: '\u{1F4B0}', label: 'Improve close rate', prompt: 'How can Better Boss help me improve my close rate?' }
  ]
};

// ─── Main Application ───────────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('personality');
  const [mounted, setMounted] = useState(false);
  const chatRef = useRef(null);

  // ─── Load saved data on mount ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedKey = localStorage.getItem('mrBetterBoss_apiKey');
    const savedSettings = localStorage.getItem('mrBetterBoss_settings');

    if (savedKey && savedKey.startsWith('sk-ant-')) {
      setApiKey(savedKey);
      setShowApiModal(false);
    } else {
      setShowApiModal(true);
    }

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved settings');
      }
    }
  }, []);

  // ─── Auto-scroll chat ─────────────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // ─── Save settings ────────────────────────────────────────────────────────
  const saveSettings = () => {
    localStorage.setItem('mrBetterBoss_settings', JSON.stringify(settings));
    setShowSettings(false);
  };

  // ─── Connect with API key (LIVE - no demo mode) ──────────────────────────
  const connectApiKey = useCallback(async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please enter your Anthropic API key');
      return;
    }

    if (!trimmed.startsWith('sk-ant-')) {
      setError('Invalid API key format. It should start with sk-ant-');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: trimmed,
          messages: [{ role: 'user', content: 'Say hello in one sentence.' }]
        })
      });

      const data = await response.json();

      if (response.ok && data.content) {
        localStorage.setItem('mrBetterBoss_apiKey', trimmed);
        setApiKey(trimmed);
        setShowApiModal(false);
        setError('');
      } else {
        setError(data.error || 'Failed to connect. Check your API key and try again.');
      }
    } catch (err) {
      setError('Connection failed. Make sure you are online and the API key is valid.');
    }

    setIsLoading(false);
  }, [apiKey]);

  // ─── Send message (LIVE API call) ─────────────────────────────────────────
  const sendMessage = useCallback(async (text, toolContext) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isLoading || !apiKey) return;

    const userMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          messages: newMessages,
          tool: toolContext || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } else if (response.status === 401) {
        setError('API key is invalid or expired. Please update it in Settings.');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Your API key appears to be invalid or expired. Please go to Settings > API to update it.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error || 'Something went wrong. Please try again.'}`
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please check your internet connection and try again.'
      }]);
    }

    setIsLoading(false);
  }, [messages, isLoading, apiKey]);

  // ─── Quick action helpers ─────────────────────────────────────────────────
  const updateQuickAction = (index, field, value) => {
    setSettings(s => ({
      ...s,
      quickActions: s.quickActions.map((qa, i) =>
        i === index ? { ...qa, [field]: value } : qa
      )
    }));
  };

  const addQuickAction = () => {
    if (settings.quickActions.length < 8) {
      setSettings(s => ({
        ...s,
        quickActions: [...s.quickActions, { emoji: '\u{1F4A1}', label: 'New', prompt: 'New prompt' }]
      }));
    }
  };

  const removeQuickAction = (index) => {
    setSettings(s => ({
      ...s,
      quickActions: s.quickActions.filter((_, i) => i !== index)
    }));
  };

  // ─── Format message content (markdown) ────────────────────────────────────
  const formatContent = (text) => {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.4);padding:12px 16px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0;white-space:pre-wrap;word-break:break-word;">$1</pre>');
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>');
    // Bold (must run before italic)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic - only match single * not preceded/followed by another *
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    return html;
  };

  // ─── Disconnect / change key ──────────────────────────────────────────────
  const disconnectKey = () => {
    localStorage.removeItem('mrBetterBoss_apiKey');
    setApiKey('');
    setMessages([]);
    setShowSettings(false);
    setShowApiModal(true);
  };

  const resetEverything = () => {
    localStorage.removeItem('mrBetterBoss_apiKey');
    localStorage.removeItem('mrBetterBoss_settings');
    setApiKey('');
    setMessages([]);
    setSettings(DEFAULT_SETTINGS);
    setShowSettings(false);
    setShowApiModal(true);
  };

  // ─── Don't render until client-side mounted ───────────────────────────────
  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9889;</div>
          <div style={{ fontSize: 18, opacity: 0.7 }}>Loading Mr. Better Boss...</div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder, textarea::placeholder {
          color: #6b6b8a;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(93,71,250,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(93,71,250,0.5); }
      `}} />

      {/* ─── API Key Modal ─────────────────────────────────────────────────── */}
      {showApiModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalRobot}>
              <div style={{ position: 'absolute', top: 22, display: 'flex', gap: 12 }}>
                <span style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #fff' }}></span>
                <span style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #fff' }}></span>
              </div>
              <span style={{ position: 'absolute', bottom: 18, fontSize: 24 }}>&#9889;</span>
            </div>
            <h2 style={styles.modalTitle}>Connect Mr. Better Boss</h2>
            <p style={styles.modalSubtitle}>
              Enter your Anthropic API key to activate your live AI assistant with web search.
            </p>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>Anthropic API Key</label>
              <div style={styles.inputWrapper}>
                <input
                  type={apiKeyVisible ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && connectApiKey()}
                  placeholder="sk-ant-api03-..."
                  style={styles.input}
                  autoFocus
                />
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  style={styles.toggleBtn}
                  type="button"
                >
                  {apiKeyVisible ? '\u{1F648}' : '\u{1F441}\uFE0F'}
                </button>
              </div>
              <p style={styles.helpText}>
                Get your API key from{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={styles.link}>
                  console.anthropic.com
                </a>
              </p>
            </div>

            <button
              onClick={connectApiKey}
              disabled={isLoading}
              style={{ ...styles.primaryBtn, opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
            >
              {isLoading ? 'Connecting...' : 'Connect & Start'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#6b6b8a', lineHeight: 1.6 }}>
                Your key is stored locally in your browser only.
                <br />It is sent directly to the Anthropic API &mdash; never to our servers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ────────────────────────────────────────────────── */}
      {showSettings && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: 600 }}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Settings</h2>
              <button onClick={() => setShowSettings(false)} style={styles.closeBtn}>&#x00D7;</button>
            </div>

            <div style={styles.tabs}>
              {[
                { id: 'personality', label: 'Personality' },
                { id: 'quickactions', label: 'Quick Actions' },
                { id: 'api', label: 'API Key' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tab,
                    background: activeTab === tab.id ? '#5d47fa' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : '#6b6b8a'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'personality' && (
              <div style={styles.tabContent}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Bot Name</label>
                  <input
                    value={settings.botName}
                    onChange={(e) => setSettings(s => ({ ...s, botName: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tagline</label>
                  <input
                    value={settings.tagline}
                    onChange={(e) => setSettings(s => ({ ...s, tagline: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Welcome Message</label>
                  <textarea
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings(s => ({ ...s, welcomeMessage: e.target.value }))}
                    rows={4}
                    style={{ ...styles.input, resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'quickactions' && (
              <div style={styles.tabContent}>
                <p style={{ color: '#6b6b8a', fontSize: 13, marginBottom: 16 }}>
                  Customize quick action buttons (max 8)
                </p>
                {settings.quickActions.map((qa, i) => (
                  <div key={i} style={styles.quickActionEditor}>
                    <input
                      value={qa.emoji}
                      onChange={(e) => updateQuickAction(i, 'emoji', e.target.value)}
                      style={{ ...styles.input, width: 50, textAlign: 'center', padding: 8 }}
                    />
                    <input
                      value={qa.label}
                      onChange={(e) => updateQuickAction(i, 'label', e.target.value)}
                      placeholder="Label"
                      style={{ ...styles.input, width: 100, padding: 8 }}
                    />
                    <input
                      value={qa.prompt}
                      onChange={(e) => updateQuickAction(i, 'prompt', e.target.value)}
                      placeholder="Prompt"
                      style={{ ...styles.input, flex: 1, padding: 8 }}
                    />
                    <button onClick={() => removeQuickAction(i)} style={styles.deleteBtn}>&#x1F5D1;&#xFE0F;</button>
                  </div>
                ))}
                {settings.quickActions.length < 8 && (
                  <button onClick={addQuickAction} style={styles.addBtn}>+ Add Quick Action</button>
                )}
              </div>
            )}

            {activeTab === 'api' && (
              <div style={styles.tabContent}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Current API Key</label>
                  <div style={styles.inputWrapper}>
                    <input
                      type="password"
                      value={apiKey}
                      readOnly
                      style={{ ...styles.input, opacity: 0.7 }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#10b981', marginTop: 8 }}>
                    &#x2713; Connected and active
                  </p>
                </div>
                <button onClick={disconnectKey} style={styles.secondaryBtn}>
                  Change API Key
                </button>
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(93,71,250,0.2)' }}>
                  <button
                    onClick={resetEverything}
                    style={{ ...styles.secondaryBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button onClick={() => setMessages([])} style={styles.secondaryBtn}>Clear Chat</button>
              <button onClick={saveSettings} style={styles.primaryBtn}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.avatar}>
          <div style={{ position: 'absolute', top: 14, display: 'flex', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #fff' }}></span>
            <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #fff' }}></span>
          </div>
          <span style={{ position: 'absolute', bottom: 8, fontSize: 16 }}>&#9889;</span>
        </div>
        <div style={styles.headerInfo}>
          <div style={styles.headerTitle}>{settings.botName}</div>
          <div style={styles.headerSubtitle}>{settings.tagline}</div>
        </div>
        <button onClick={() => setShowSettings(true)} style={styles.headerBtn}>Settings</button>
        <div style={styles.status}>
          <span style={styles.statusDot}></span>
          {apiKey ? 'Live' : 'Offline'}
        </div>
      </header>

      {/* ─── Chat Area ─────────────────────────────────────────────────────── */}
      <div ref={chatRef} style={styles.chatArea}>
        {messages.length === 0 ? (
          <div style={styles.welcome}>
            <div style={styles.welcomeRobot}>
              <div style={{ position: 'absolute', top: 30, display: 'flex', gap: 20 }}>
                <span style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #fff' }}></span>
                <span style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #fff' }}></span>
              </div>
              <span style={{ position: 'absolute', bottom: 28, fontSize: 32 }}>&#9889;</span>
            </div>
            <h1 style={styles.welcomeTitle}>Hey there!</h1>
            <p style={styles.welcomeText}>{settings.welcomeMessage}</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: 12,
              maxWidth: '85%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: msg.role === 'user' ? '#25253d' : 'linear-gradient(145deg, #5d47fa, #4a38d4)',
                fontSize: 16,
                flexShrink: 0,
              }}>
                {msg.role === 'user' ? '\u{1F464}' : '\u26A1'}
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 18,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #5d47fa, #7a64ff)' : '#25253d',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(93,71,250,0.2)',
                  lineHeight: 1.7,
                  fontSize: 15,
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
            </div>
          ))
        )}
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: 12,
            maxWidth: '85%',
            alignSelf: 'flex-start',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #5d47fa, #4a38d4)',
              fontSize: 16,
              flexShrink: 0,
            }}>&#9889;</div>
            <div style={styles.typing}>
              <span style={{ ...styles.typingDot, animationDelay: '0s' }}></span>
              <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}></span>
              <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Quick Actions ─────────────────────────────────────────────────── */}
      {messages.length === 0 && (
        <div style={styles.quickActions}>
          {settings.quickActions.map((qa, i) => (
            <button
              key={i}
              onClick={() => sendMessage(qa.prompt)}
              disabled={isLoading || !apiKey}
              style={{
                ...styles.quickActionBtn,
                opacity: (isLoading || !apiKey) ? 0.5 : 1,
                cursor: (isLoading || !apiKey) ? 'not-allowed' : 'pointer'
              }}
            >
              {qa.emoji} {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input Area ────────────────────────────────────────────────────── */}
      <div style={styles.inputArea}>
        <div style={styles.chatInputWrapper}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={apiKey ? `Ask ${settings.botName} anything...` : 'Connect your API key to start...'}
            disabled={isLoading || !apiKey}
            style={styles.chatInput}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim() || !apiKey}
            style={{
              ...styles.sendBtn,
              opacity: (isLoading || !input.trim() || !apiKey) ? 0.5 : 1,
              cursor: (isLoading || !input.trim() || !apiKey) ? 'not-allowed' : 'pointer'
            }}
          >
            &#10148;
          </button>
        </div>
      </div>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <div style={styles.footer}>
        Powered by{' '}
        <a href="https://better-boss.ai" target="_blank" rel="noreferrer" style={styles.footerLink}>Better Boss</a>
        {' '}&middot; JobTread Certified Implementation Partner
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#1a1a2e',
    color: '#fffdfd',
    overflow: 'hidden',
  },
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  modal: {
    background: '#25253d',
    borderRadius: 24,
    padding: 32,
    maxWidth: 480,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalRobot: {
    width: 90,
    height: 90,
    background: 'linear-gradient(145deg, #5d47fa, #4a38d4)',
    borderRadius: 24,
    margin: '0 auto 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 40px rgba(93, 71, 250, 0.4)',
    position: 'relative',
    animation: 'float 3s ease-in-out infinite',
  },
  modalTitle: { textAlign: 'center', fontSize: 24, marginBottom: 8, fontWeight: 700 },
  modalSubtitle: { textAlign: 'center', color: '#6b6b8a', marginBottom: 24, lineHeight: 1.5, fontSize: 15 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalFooter: { display: 'flex', gap: 12, marginTop: 24 },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 10,
    width: 36,
    height: 36,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Form
  formGroup: { marginBottom: 20 },
  label: { display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 },
  inputWrapper: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    background: '#1a1a2e',
    border: '2px solid rgba(93,71,250,0.3)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  toggleBtn: {
    background: '#1a1a2e',
    border: '2px solid rgba(93,71,250,0.3)',
    borderRadius: 12,
    padding: '0 16px',
    color: '#6b6b8a',
    cursor: 'pointer',
    fontSize: 16,
  },
  helpText: { fontSize: 13, color: '#6b6b8a', marginTop: 10 },
  link: { color: '#7a64ff', textDecoration: 'none' },
  error: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    color: '#ef4444',
    fontSize: 14,
  },
  primaryBtn: {
    width: '100%',
    padding: 16,
    background: 'linear-gradient(135deg, #5d47fa, #7a64ff)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    background: '#1a1a2e',
    border: '2px solid rgba(93,71,250,0.3)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  // Tabs
  tabs: { display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(93,71,250,0.2)', paddingBottom: 12 },
  tab: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 16 },
  // Quick action editor
  quickActionEditor: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 },
  deleteBtn: {
    background: 'rgba(239,68,68,0.2)',
    border: 'none',
    borderRadius: 10,
    width: 40,
    height: 40,
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    padding: 14,
    background: 'transparent',
    border: '2px dashed rgba(93,71,250,0.3)',
    borderRadius: 12,
    color: '#6b6b8a',
    cursor: 'pointer',
    width: '100%',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  // Header
  header: {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #25253d, #1a1a2e)',
    borderBottom: '1px solid rgba(93,71,250,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexShrink: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    background: 'linear-gradient(145deg, #5d47fa, #4a38d4)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 4px 20px rgba(93,71,250,0.4)',
    flexShrink: 0,
  },
  headerInfo: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  headerSubtitle: { fontSize: 13, color: '#6b6b8a', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  headerBtn: {
    padding: '8px 16px',
    background: 'rgba(93,71,250,0.15)',
    border: '1px solid rgba(93,71,250,0.3)',
    borderRadius: 10,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Inter', system-ui, sans-serif",
    flexShrink: 0,
  },
  status: {
    padding: '8px 14px',
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 20,
    fontSize: 13,
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  statusDot: { width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block' },
  // Chat
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: 'radial-gradient(ellipse at top left, rgba(93,71,250,0.08) 0%, transparent 50%), #1a1a2e',
  },
  welcome: { textAlign: 'center', padding: '48px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  welcomeRobot: {
    width: 100,
    height: 100,
    background: 'linear-gradient(145deg, #5d47fa, #4a38d4)',
    borderRadius: 28,
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 12px 48px rgba(93,71,250,0.5)',
    animation: 'float 3s ease-in-out infinite',
  },
  welcomeTitle: { fontSize: 28, marginBottom: 12, fontWeight: 800 },
  welcomeText: { color: '#6b6b8a', maxWidth: 420, margin: '0 auto', lineHeight: 1.7, fontSize: 15 },
  typing: {
    padding: '16px 20px',
    background: '#25253d',
    border: '1px solid rgba(93,71,250,0.2)',
    borderRadius: 18,
    display: 'flex',
    gap: 6,
  },
  typingDot: {
    width: 10,
    height: 10,
    background: '#5d47fa',
    borderRadius: '50%',
    animation: 'pulse 1.4s infinite',
    display: 'inline-block',
  },
  // Quick actions
  quickActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: '14px 24px',
    borderTop: '1px solid rgba(93,71,250,0.15)',
    background: 'rgba(0,0,0,0.2)',
    flexShrink: 0,
  },
  quickActionBtn: {
    padding: '10px 16px',
    background: '#25253d',
    border: '1px solid rgba(93,71,250,0.3)',
    borderRadius: 20,
    color: '#fff',
    fontSize: 14,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  // Input
  inputArea: { padding: '14px 24px 20px', background: '#25253d', borderTop: '1px solid rgba(93,71,250,0.2)', flexShrink: 0 },
  chatInputWrapper: {
    display: 'flex',
    gap: 12,
    background: '#1a1a2e',
    border: '2px solid rgba(93,71,250,0.3)',
    borderRadius: 16,
    padding: 6,
  },
  chatInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: 15,
    padding: '12px 14px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sendBtn: {
    width: 48,
    height: 48,
    background: 'linear-gradient(135deg, #5d47fa, #7a64ff)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Footer
  footer: {
    padding: 12,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b6b8a',
    borderTop: '1px solid rgba(93,71,250,0.1)',
    flexShrink: 0,
  },
  footerLink: { color: '#7a64ff', textDecoration: 'none', fontWeight: 600 },
};
