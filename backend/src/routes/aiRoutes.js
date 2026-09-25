const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { extractSearchIntent, generateChatbotResponse } = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/ai/search-intent
 * Extracts category, mode, urgency, and clarifying question from plain text.
 */
router.post('/search-intent', async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for intent extraction' });
    }

    const intent = await extractSearchIntent(prompt);
    res.json(intent);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/chat
 * Conversational cooperative assistant.
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history = [], userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await generateChatbotResponse(message, history);

    // If userId provided, log chat messages to database
    if (userId) {
      try {
        db.prepare('INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)')
          .run(userId, 'user', message);
        db.prepare('INSERT INTO chat_messages (user_id, role, message) VALUES (?, ?, ?)')
          .run(userId, 'bot', reply);
      } catch (logErr) {
        console.warn('[AI Routes] Could not persist chat message:', logErr.message);
      }
    }

    res.json({
      reply,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
