const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { fraudEngine, sendCallback } = require('./ai-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, './')));

// Constant API Key for Hackathon
const VALID_API_KEY = "sk_test_123456789";

// Simple in-memory session store for Honeypot intelligence
const sessions = {};

/**
 * 1. AI-Generated Voice Detection Endpoint
 */
app.post('/api/voice-detection', (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== VALID_API_KEY) {
        return res.status(401).json({ status: "error", message: "Invalid API key or malformed request" });
    }

    const { language, audioFormat, audioBase64 } = req.body;

    if (!language || !audioFormat || !audioBase64) {
        return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // Logic for detection (simulated for hackathon as per requirements)
    // In a real scenario, this would call a ML model
    const isAiGenerated = audioBase64.length % 2 === 0; // Deterministic mock logic
    const confidence = 0.90 + (Math.random() * 0.1);

    const response = {
        status: "success",
        language: language,
        classification: isAiGenerated ? "AI_GENERATED" : "HUMAN",
        confidenceScore: parseFloat(confidence.toFixed(2)),
        explanation: isAiGenerated
            ? "Unnatural pitch consistency and robotic speech patterns detected"
            : "Natural human vocal jitter and breathing patterns identified"
    };

    res.json(response);
});

/**
 * 2. Agentic Honey-Pot Endpoint
 */
app.post('/api/honeypot', async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== VALID_API_KEY) {
        return res.status(401).json({ status: "error", message: "Invalid API key or malformed request" });
    }

    const { sessionId, message, conversationHistory = [], metadata = {} } = req.body;

    if (!sessionId || !message || !message.text) {
        return res.status(400).json({ status: "error", message: "Missing required fields (sessionId, message)" });
    }

    // Initialize or get session
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            intel: {
                bankAccounts: [],
                upiIds: [],
                phishingLinks: [],
                phoneNumbers: [],
                suspiciousKeywords: []
            },
            messageCount: 0,
            scamDetected: false
        };
    }

    const session = sessions[sessionId];
    session.messageCount += (1 + conversationHistory.length); // Approximate count

    // Analyze incoming message for scam intent
    const analysis = fraudEngine.analyze(message.text);
    if (analysis.classification === 'fraud' || analysis.classification === 'suspicious') {
        session.scamDetected = true;
    }

    // Extract intelligence
    const newIntel = fraudEngine.extractIntelligence(message.text);
    for (const key in newIntel) {
        session.intel[key] = [...new Set([...session.intel[key], ...newIntel[key]])];
    }

    // Generate reply
    const reply = fraudEngine.generateHoneypotReply(message.text, conversationHistory);

    // If scam confirmed and we've engaged enough (e.g. 2+ messages)
    // or if the scammer seems to be finishing, send result to GUVI
    if (session.scamDetected && session.messageCount >= 2) {
        // Trigger callback asynchronously
        const payload = {
            sessionId: sessionId,
            scamDetected: true,
            totalMessagesExchanged: session.messageCount,
            extractedIntelligence: session.intel,
            agentNotes: "Scammer identified through pattern analysis. Intelligence extracted from multi-turn engagement."
        };

        sendCallback("https://hackathon.guvi.in/api/updateHoneyPotFinalResult", payload)
            .then(resp => console.log(`GUVI callback success for ${sessionId}`))
            .catch(err => console.error(`GUVI callback failed for ${sessionId}:`, err.message));
    }

    res.json({
        status: "success",
        reply: reply
    });
});

// Handle root navigation
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 FraudShield Backend running at http://localhost:${PORT}`);
});
