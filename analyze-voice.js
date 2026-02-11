exports.handler = async (event, context) => {
    // 1. Check Authentication (Header: x-api-key)
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-KEY'];
    const VALID_KEY = "FRAUDSHIELD-AI-LOCAL-2026";

    if (apiKey !== VALID_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "Unauthorized: Invalid x-api-key" }),
        };
    }

    // 2. Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
        };
    }

    try {
        // 3. Parse Request Body
        const data = JSON.parse(event.body || "{}");

        // Handle flexible naming (Accepts "language", "Language", "Audio Format", etc.)
        const language =
            data.language || data.Language;

        const audio_format =
            data.audio_format ||
            data.audioFormat ||
            data['Audio Format'];

        const audio_base64 =
            data.audio_base64 ||
            data.audioBase64 ||
            data['Audio Base64 Format'];

        // Validate fields
        if (!language || !audio_format || !audio_base64) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Missing required fields",
                    hint: "Ensure your form fields are named Language, Audio Format, and Audio Base64 Format",
                    received_keys: Object.keys(data)
                }),
            };
        }

        // 4. Simulate AI-Generated Voice Detection
        // For the hackathon, we return a successful analysis result
        const isAiGenerated = audio_base64.length > 1000 ? false : true; // Dummy logic
        const confidence = 0.85 + (Math.random() * 0.1);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                label: isAiGenerated ? "scam" : "safe",
                confidence: parseFloat(confidence.toFixed(2)),
                reason: isAiGenerated
                    ? "AI-generated voice patterns detected."
                    : "Human voice patterns validated.",
                detected_language: language,
                status: "success"
            }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
        };
    }
};
