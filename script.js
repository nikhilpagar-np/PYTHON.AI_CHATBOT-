 /* =========================================================
   starfam.ai — chat logic (simple version)
   Parts:  1 Settings   2 Page elements   3 Saved chats
           4 Drawing messages   5 Talking to the server
           6 Buttons   7 Star background   8 Start
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 1. Settings ---------- */
  // This is YOUR server address. Do not change it, or the chatbot stops answering.
  const API_URL = 'https://pixle-ai.onrender.com/chat';
  const TIMEOUT_MS = 60000;                 // give up after 60 seconds
  const SAVE_KEY = 'starfam-ai-chats';      // where chats are saved in the browser
  const LOGO = 'images/logo.png';           // full logo
  const SPINNER = 'images/star.png';        // star that spins while thinking

  /* ---------- 2. Page elements ---------- */
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const messagesBox = $('messages');
  const input = $('input');
  const sendBtn = $('sendBtn');
  const historyBox = $('historyList');
  const statusBox = $('status');
  const statusText = $('statusText');
  const toast = $('toast');

  // chats = [{ id, title, messages: [{ role: 'user' or 'bot', text, error, retryText }] }]
  let chats = loadChats();
  let activeId = null;       // which chat is open
  let waiting = false;       // true while we wait for the AI

  /* ---------- 3. Saved chats ---------- */
  function loadChats() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; }
    catch { return []; }
  }
  function saveChats() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(chats)); } catch { /* storage blocked */ }
  }
  const currentChat = () => chats.find((c) => c.id === activeId);

  /* ---------- 4. Drawing messages ---------- */

  // Make text safe, so nobody can sneak HTML into the page
  function safe(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Turn AI text into HTML: ```code```, `code`, **bold** and paragraphs
  function formatReply(text) {
    const codeBlocks = [];
    let html = safe(text).replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return `\u0000${codeBlocks.length - 1}\u0000`;
    });
    html = html
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .split(/\n{2,}/)
      .map((part) => (part.startsWith('\u0000') ? part : `<p>${part.replace(/\n/g, '<br>')}</p>`))
      .join('');
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => codeBlocks[i]);
  }

  function showToast(text) {            // small "Copied" popup
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); showToast('Copied'); }
    catch { showToast('Copy failed'); }
  }

  function scrollDown() { messagesBox.scrollTop = messagesBox.scrollHeight; }

  // Small button under a reply (Copy / Regenerate / Retry)
  function makeButton(label, onClick, extraClass = '') {
    const button = document.createElement('button');
    button.className = `action-btn ${extraClass}`.trim();
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  // Add one message to the screen
  function showMessage(msg, isLast = true) {
    const row = document.createElement('div');
    row.className = `msg ${msg.role}${msg.error ? ' error' : ''}`;
    if (msg.role === 'bot') row.innerHTML = `<div class="ai-icon"><img src="${LOGO}" alt="" /></div>`;

    const body = document.createElement('div');
    body.className = 'msg-body';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (msg.role === 'user') bubble.textContent = msg.text;
    else bubble.innerHTML = formatReply(msg.text);
    body.appendChild(bubble);

    if (msg.role === 'bot') {
      const buttons = document.createElement('div');
      buttons.className = 'msg-actions';
      if (msg.error) {
        buttons.appendChild(makeButton('Retry', () => retry(msg), 'regen'));
      } else {
        buttons.appendChild(makeButton('Copy', () => copyText(msg.text)));
        if (isLast) buttons.appendChild(makeButton('Regenerate', () => regenerate(msg), 'regen'));
      }
      body.appendChild(buttons);
    }

    row.appendChild(body);
    messagesBox.appendChild(row);
    scrollDown();
  }

  function showWelcome() {
    messagesBox.innerHTML = `
      <div class="welcome">
        <img src="${LOGO}" alt="starfam.ai star logo" />
        <h2>Explore the universe of ideas.</h2>
        <p>One Life. A Million Things to Discover.<br>Explore, Create &amp; Imagine with StarFam AI.</p>
      </div>`;
  }

  // Draw the whole open chat
  function showChat() {
    const chat = currentChat();
    messagesBox.innerHTML = '';
    if (!chat || !chat.messages.length) return showWelcome();
    chat.messages.forEach((msg, i) => showMessage(msg, i === chat.messages.length - 1));
  }

  // Draw the chat list in the sidebar
  function showHistory() {
    historyBox.innerHTML = '';
    if (!chats.length) {
      historyBox.innerHTML = '<p class="history-empty label">No chats yet</p>';
      return;
    }
    chats.forEach((chat) => {
      const item = document.createElement('div');
      item.className = 'history-item' + (chat.id === activeId ? ' active' : '');
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
        <span>${safe(chat.title)}</span>
        <button class="del" aria-label="Delete chat" title="Delete chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      item.addEventListener('click', () => openChat(chat.id));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === item) openChat(chat.id); });
      item.querySelector('.del').addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
      historyBox.appendChild(item);
    });
  }

  // The spinning star shown while the AI is thinking
  function showThinking() {
    const row = document.createElement('div');
    row.className = 'msg bot thinking';
    row.id = 'thinking';
    row.innerHTML = `
      <img class="spinner" src="${SPINNER}" alt="" />
      <div class="bubble">starfam.ai is thinking…</div>`;
    messagesBox.appendChild(row);
    scrollDown();
  }
  function hideThinking() { const row = $('thinking'); if (row) row.remove(); }

  function setWaiting(value) {
    waiting = value;
    messagesBox.setAttribute('aria-busy', String(value));
    updateSendButton();
  }
  function updateSendButton() { sendBtn.disabled = waiting || !input.value.trim(); }

  /* ---------- Chat list actions ---------- */
  function closeSidebar() { app.classList.remove('open'); }

  function newChat() {
    if (waiting) return;
    const emptyChat = chats.find((c) => !c.messages.length);   // reuse a blank chat
    if (emptyChat) {
      activeId = emptyChat.id;
    } else {
      const chat = { id: Date.now().toString(36), title: 'New chat', messages: [] };
      chats.unshift(chat);
      activeId = chat.id;
    }
    saveChats(); showHistory(); showChat(); closeSidebar();
    input.focus();
  }

  function openChat(id) {
    if (waiting) return;
    activeId = id;
    showHistory(); showChat(); closeSidebar();
  }

  function deleteChat(id) {
    if (waiting) return;
    chats = chats.filter((c) => c.id !== id);
    if (id === activeId) activeId = chats[0]?.id ?? null;
    if (!activeId) return newChat();
    saveChats(); showHistory(); showChat();
  }

  function clearChat() {
    const chat = currentChat();
    if (!chat || waiting || !chat.messages.length) return;
    chat.messages = [];
    chat.title = 'New chat';
    saveChats(); showHistory(); showChat();
  }

  function copyWholeChat() {
    const chat = currentChat();
    if (!chat || !chat.messages.length) return showToast('Nothing to copy yet');
    const text = chat.messages
      .filter((m) => !m.error)
      .map((m) => `${m.role === 'user' ? 'You' : 'starfam.ai'}: ${m.text}`)
      .join('\n\n');
    copyText(text);
  }

  /* ---------- 5. Talking to the server ---------- */
  function setStatus(online) {
    statusBox.classList.toggle('offline', !online);
    statusText.textContent = online ? 'Online' : 'Offline';
  }

  // Send the question to the server and return its answer
  async function askServer(message) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Unexpected response format');
      return data.reply;
    } finally {
      clearTimeout(timer);
    }
  }

  function errorText(err) {
    if (err.name === 'AbortError') return 'The request took too long. The server may be waking up, so try again in a moment.';
    if (err instanceof TypeError) return 'Can’t reach the starfam.ai server. Check your internet, then retry. If the server was idle, it can take up to a minute to wake up.';
    return `Something went wrong: ${err.message}`;
  }

  // Get an answer for `text` and show it
  async function getReply(text) {
    const chat = currentChat();
    if (!chat) return;
    document.querySelectorAll('.regen').forEach((b) => b.remove());   // only the newest reply keeps its button
    setWaiting(true);
    showThinking();
    try {
      const msg = { role: 'bot', text: await askServer(text) };
      hideThinking();
      chat.messages.push(msg);
      showMessage(msg);
      setStatus(true);
    } catch (err) {
      hideThinking();
      const msg = { role: 'bot', text: errorText(err), error: true, retryText: text };
      chat.messages.push(msg);
      showMessage(msg);
      setStatus(!(err instanceof TypeError));
    } finally {
      setWaiting(false);
      saveChats();
      input.focus();
    }
  }

  function retry(errorMsg) {            // try again after an error
    if (waiting) return;
    const chat = currentChat();
    chat.messages = chat.messages.filter((m) => m !== errorMsg);
    showChat();
    getReply(errorMsg.retryText);
  }

  function regenerate(botMsg) {         // ask the same question again
    if (waiting) return;
    const chat = currentChat();
    const index = chat.messages.indexOf(botMsg);
    const question = chat.messages.slice(0, index).reverse().find((m) => m.role === 'user');
    if (!question) return;
    chat.messages.splice(index, 1);
    showChat();
    getReply(question.text);
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || waiting) return;                 // ignore empty or double sends
    if (!currentChat()) newChat();
    const chat = currentChat();

    if (!chat.messages.length) {                  // first message: name the chat
      messagesBox.innerHTML = '';
      chat.title = text.length > 34 ? text.slice(0, 34) + '…' : text;
      showHistory();
    }

    const msg = { role: 'user', text };
    chat.messages.push(msg);
    document.querySelectorAll('.regen').forEach((b) => b.remove());
    showMessage(msg);
    input.value = '';
    resizeInput();
    saveChats();
    await getReply(text);
  }

  /* ---------- 6. Buttons and typing ---------- */
  function resizeInput() {                        // the box grows as you type
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
    updateSendButton();
  }

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', (e) => {
    // Enter sends. Shift+Enter makes a new line.
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);
  $('newChatBtn').addEventListener('click', newChat);
  $('collapseBtn').addEventListener('click', () => app.classList.toggle('collapsed'));
  $('menuBtn').addEventListener('click', () => app.classList.toggle('open'));
  $('backdrop').addEventListener('click', closeSidebar);
  $('clearBtn').addEventListener('click', clearChat);
  $('copyChatBtn').addEventListener('click', copyWholeChat);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

  /* ---------- 7. Star background ----------
     Stars have a depth. Near stars are bigger and move more when you move the mouse. */
  function startStars() {
    const canvas = $('starfield');
    const ctx = canvas.getContext('2d');
    const universe = canvas.parentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, stars = [], mouseX = 0, mouseY = 0, shiftX = 0, shiftY = 0;

    function makeStars() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const count = width < 700 ? 90 : 180;
      stars = Array.from({ length: count }, () => ({
        x: Math.random(), y: Math.random(),
        depth: Math.random() * 0.9 + 0.1,          // 0.1 = far, 1 = near
        blink: Math.random() * 6,
      }));
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        const x = star.x * width + shiftX * star.depth * 46;
        const y = star.y * height + shiftY * star.depth * 46;
        const blink = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(time / 900 + star.blink);
        ctx.fillStyle = `rgba(207, 224, 255, ${(0.25 + 0.75 * star.depth) * blink})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.4 + star.depth * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function animate(time) {
      shiftX += (mouseX - shiftX) * 0.04;          // move smoothly toward the mouse
      shiftY += (mouseY - shiftY) * 0.04;
      universe.style.setProperty('--px', (shiftX * -16).toFixed(1) + 'px');
      universe.style.setProperty('--py', (shiftY * -16).toFixed(1) + 'px');
      stars.forEach((star) => { star.x += 0.00006 * star.depth; if (star.x > 1.02) star.x = -0.02; });
      draw(time);
      requestAnimationFrame(animate);
    }

    makeStars();
    window.addEventListener('resize', () => { makeStars(); draw(0); });
    if (reduceMotion) return draw(0);              // still picture for reduced motion
    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX / width - 0.5;
      mouseY = e.clientY / height - 0.5;
    }, { passive: true });
    requestAnimationFrame(animate);
  }

  /* ---------- 8. Start ---------- */
  startStars();
  activeId = chats[0]?.id ?? null;
  if (!activeId) newChat();
  else { showHistory(); showChat(); }
  resizeInput();
})();
