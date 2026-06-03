const express = require('express');
let fetchFn;
try {
  // node-fetch v3 is ESM; require may expose default
  const nf = require('node-fetch');
  fetchFn = (...args) => nf(...args);
} catch (e) {
  // fallback to global fetch (Node 18+)
  fetchFn = global.fetch;
}
const fs = require('fs');
const path = require('path');

const router = express.Router();

// POST /ai/chat
// Body: { messages: [{ role: 'user'|'assistant'|'system', text }], message: string }
router.post('/chat', async (req, res) => {
  try {
    const { messages, message } = req.body || {};
    let chatMessages = [];

    if (Array.isArray(messages)) {
      chatMessages = messages.map(m => ({ role: m.role === 'user' ? 'user' : (m.role === 'ai' ? 'assistant' : m.role), content: m.text }));
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ message: 'Missing messages or message in request body' });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!OPENAI_KEY) return res.status(500).json({ message: 'OPENAI_API_KEY not configured on server' });

    const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: MODEL, messages: chatMessages, temperature: 0.2 })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ message: 'AI provider error', details: errText });
    }

    const data = await response.json();
    const aiText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content ? data.choices[0].message.content : 'Sorry, no response from model';

    // Persist conversation (append) for basic training/inspection
    try {
      const storeDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true });
      const convoFile = path.join(storeDir, 'conversations.json');
      const entry = { id: Date.now(), messages: chatMessages.map(m => ({ role: m.role, content: m.content })), response: aiText, created_at: new Date().toISOString() };
      let arr = [];
      if (fs.existsSync(convoFile)) {
        try { arr = JSON.parse(fs.readFileSync(convoFile, 'utf8') || '[]'); } catch (e) { arr = []; }
      }
      arr.push(entry);
      fs.writeFileSync(convoFile, JSON.stringify(arr, null, 2));
    } catch (e) {
      console.warn('Failed to persist conversation', e.message);
    }

    return res.json({ text: aiText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal error', error: err.message });
  }
});

module.exports = router;
