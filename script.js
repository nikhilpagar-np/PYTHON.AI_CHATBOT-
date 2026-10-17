/* =========================================================
   PIXLE.AI — chat logic + FastAPI backend communication
   ========================================================= */
(() => {
  'use strict';

  // ---------- Config ----------
  const API_URL = 'https://pixle-ai.onrender.com/chat';
  const REQUEST_TIMEOUT_MS = 60000;
  const STORAGE_KEY = 'pixle-ai-chats';

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const messagesEl = $('messages');
  const inputEl = $('input');
  const sendBtn = $('sendBtn');
  const historyEl = $('historyList');
  const statusEl = $('status');
  const statusText = $('statusText');

  // ---------- State ----------
  let chats = loadChats();      // [{ id, title, messages: [{role, text, error?}] }]
  let activeId = null;
  let busy = false;

  // ---------- Persistence (safe: storage can be unavailable) ----------
  function loadChats() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function saveChats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch { /* ignore */ }
  }

  // ---------- Helpers ----------
  const activeChat = () => chats.find((c) => c.id === activeId);

  /** Escape HTML so model/user text can never inject markup. */
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** Tiny, safe markdown: ```code blocks```, `inline code`, **bold**, paragraphs. */
  function formatReply(text) {
    const blocks = [];
    let html = escapeHtml(text).replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_, code) => {
      blocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return `\u0000${blocks.length - 1}\u0000`;
    });
    html = html
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .split(/\n{2,}/)
      .map((p) => (p.startsWith('\u0000') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`))
      .join('');
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[i]);
  }

  const scrollToBottom = () => { messagesEl.scrollTop = messagesEl.scrollHeight; };

  // ---------- Rendering ----------
  function renderHistory() {
    historyEl.innerHTML = '';
    if (!chats.length) {
      historyEl.innerHTML = '<p class="history-empty label">No chats yet</p>';
      return;
    }
    chats.forEach((chat) => {
      const item = document.createElement('div');
      item.className = 'history-item' + (chat.id === activeId ? ' active' : '');
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
        <span>${escapeHtml(chat.title)}</span>
        <button class="del" aria-label="Delete chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      item.addEventListener('click', () => openChat(chat.id));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter') openChat(chat.id); });
      item.querySelector('.del').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
      historyEl.appendChild(item);
    });
  }

  function renderWelcome() {
    messagesEl.innerHTML = `
      <div class="welcome">
        <div class="logo">P</div>
        <h2>What can I help you with?</h2>
        <p>Ask a question, brainstorm an idea, or get help with code.</p>
        <div class="suggestions">
          <button>Explain quantum computing simply</button>
          <button>Write a Python function to sort a list</button>
          <button>Plan a 3-day trip to Goa</button>
        </div>
      </div>`;
    messagesEl.querySelectorAll('.suggestions button').forEach((b) =>
      b.addEventListener('click', () => { inputEl.value = b.textContent; sendMessage(); }));
  }

  function renderMessages() {
    const chat = activeChat();
    messagesEl.innerHTML = '';
    if (!chat || !chat.messages.length) return renderWelcome();
    chat.messages.forEach((m) => appendMessage(m, false));
    scrollToBottom();
  }

  /** Build a message row and add it to the container. */
  function appendMessage(msg, scroll = true) {
    const row = document.createElement('div');
    row.className = `msg ${msg.role}${msg.error ? ' error' : ''}`;
    if (msg.role === 'bot') row.innerHTML = '<div class="ai-icon">P</div>';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (msg.role === 'user') bubble.textContent = msg.text;
    else bubble.innerHTML = formatReply(msg.text);

    // Retry button on failed requests
    if (msg.error && msg.retryText) {
      const btn = document.createElement('button');
      btn.className = 'retry';
      btn.textContent = 'Retry';
      btn.addEventListener('click', () => {
        const chat = activeChat();
        chat.messages = chat.messages.filter((m) => m !== msg); // drop the error
        saveChats();
        row.remove();
        requestReply(msg.retryText);
      });
      bubble.appendChild(btn);
    }

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    if (scroll) scrollToBottom();
    return row;
  }

  // ---------- Typing indicator ----------
  function showTyping() {
    const row = document.createElement('div');
    row.className = 'msg bot typing';
    row.id = 'typing';
    row.innerHTML = `<div class="ai-icon">P</div>
      <div class="bubble"><span class="dots"><i></i><i></i><i></i></span><span>PIXLE.AI is thinking...</span></div>`;
    messagesEl.appendChild(row);
    scrollToBottom();
  }
  const hideTyping = () => { const t = $('typing'); if (t) t.remove(); };

  // ---------- Chat management ----------
  function newChat() {
    // Reuse an existing empty chat instead of piling up blanks
    const empty = chats.find((c) => !c.messages.length);
    if (empty) { activeId = empty.id; }
    else {
      const chat = { id: Date.now().toString(36), title: 'New chat', messages: [] };
      chats.unshift(chat);
      activeId = chat.id;
    }
    saveChats(); renderHistory(); renderMessages();
    app.classList.remove('open');
    inputEl.focus();
  }

  function openChat(id) {
    if (busy) return;
    activeId = id;
    renderHistory(); renderMessages();
    app.classList.remove('open');
  }

  function deleteChat(id) {
    if (busy) return;
    chats = chats.filter((c) => c.id !== id);
    if (id === activeId) activeId = chats[0]?.id ?? null;
    if (!activeId) return newChat();
    saveChats(); renderHistory(); renderMessages();
  }

  // ---------- Backend communication ----------
  function setStatus(online) {
    statusEl.classList.toggle('offline', !online);
    statusText.textContent = online ? 'Online' : 'Offline';
  }

  /** POST the message to FastAPI and return the `reply` string. */
  async function callBackend(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      if (typeof data.reply !== 'string') throw new Error('Unexpected response format');
      return data.reply;
    } finally {
      clearTimeout(timer);
    }
  }

  async function requestReply(text) {
    const chat = activeChat();
    busy = true; sendBtn.disabled = true;
    showTyping();
    try {
      const reply = await callBackend(text);
      hideTyping();
      const msg = { role: 'bot', text: reply };
      chat.messages.push(msg);
      appendMessage(msg);
      setStatus(true);
    } catch (err) {
      hideTyping();
      const timedOut = err.name === 'AbortError';
      const unreachable = err instanceof TypeError; // network / CORS failure
      const text_ = timedOut
        ? 'The request took too long. Try again in a moment.'
        : unreachable
          ? 'Can’t reach the PIXLE.AI server at 127.0.0.1:8000. Check that FastAPI is running and CORS is enabled.'
          : `Something went wrong: ${err.message}`;
      const msg = { role: 'bot', text: text_, error: true, retryText: text };
      chat.messages.push(msg);
      appendMessage(msg);
      setStatus(!unreachable);
    } finally {
      busy = false;
      sendBtn.disabled = !inputEl.value.trim();
      saveChats();
      inputEl.focus();
    }
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || busy) return;
    if (!activeChat()) newChat();
    const chat = activeChat();

    // First message: clear welcome screen and title the chat
    if (!chat.messages.length) {
      messagesEl.innerHTML = '';
      chat.title = text.length > 34 ? text.slice(0, 34) + '…' : text;
      renderHistory();
    }

    const msg = { role: 'user', text };
    chat.messages.push(msg);
    appendMessage(msg);
    inputEl.value = '';
    autoResize();
    saveChats();
    await requestReply(text);
  }

  // ---------- Input behaviour ----------
  function autoResize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
    sendBtn.disabled = busy || !inputEl.value.trim();
  }

  inputEl.addEventListener('input', autoResize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);

  // ---------- Sidebar & header controls ----------
  $('newChatBtn').addEventListener('click', newChat);
  $('collapseBtn').addEventListener('click', () => app.classList.toggle('collapsed'));
  $('menuBtn').addEventListener('click', () => app.classList.toggle('open'));
  $('clearBtn').addEventListener('click', () => {
    const chat = activeChat();
    if (!chat || busy) return;
    chat.messages = []; chat.title = 'New chat';
    saveChats(); renderHistory(); renderMessages();
  });
  // Tap outside the sidebar to close it on mobile
  messagesEl.addEventListener('click', () => app.classList.remove('open'));

  // ---------- Init ----------
  activeId = chats[0]?.id ?? null;
  if (!activeId) newChat();
  else { renderHistory(); renderMessages(); }
  autoResize();
})();
