exports.handler = async (event, context) => {
    // 1. Check Authentication (Header: x-api-key)
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-KEY'];
    const VALID_KEY = "FRAUDSHIELD-AI-LOCAL-2026";

    if (apiKey !== VALID_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                status: "failed",
                message: "Unauthorized: Invalid x-api-key"
            }),
        };
    }

    // 2. Parse Request Body (Always allow POST, even if body is empty)
    const body = JSON.parse(event.body || "{}");
    const userMessage = (body.message || body.text || "").toLowerCase();

    // 3. Simple Intelligent Logic
    const scamKeywords = ["winner", "lottery", "urgent", "bank", "password", "gift", "account"];
    const isScam = scamKeywords.some(keyword => userMessage.includes(keyword));

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            label: isScam ? "scam" : "safe",
            confidence: userMessage.length > 0 ? 0.95 : 1.0,
            reason: isScam
                ? "Scam indicators detected in message."
                : "Honeypot service is reachable and secured.",
            status: "success",
            timestamp: new Date().toISOString()
        }),
    };
};
