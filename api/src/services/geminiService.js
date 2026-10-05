/**
 * Gemini AI Service for Aura Meeting Assistant
 * Handles queries to Google Gemini API with stable Flash model fallbacks.
 */

const SYSTEM_INSTRUCTION = `You are Aura AI, an intelligent, concise, and helpful AI assistant inside an active Google Meet style video conference call.
Your purpose:
1. Answer participant questions crisply and accurately.
2. Provide meeting summaries, key discussion points, or action items when asked.
3. Assist with brainstorming, technical problem solving, or factual clarifications.
4. Keep answers focused, conversational, professional, and easy to read quickly during a meeting (use bullet points and bold text where helpful).
5. If someone addresses you or asks something, respond naturally as Aura AI.`;

/**
 * Call Google Gemini API
 * @param {Object} options
 * @param {string} options.prompt - The user's query or message
 * @param {Array} [options.history] - Recent chat messages for meeting context
 * @param {string} [options.senderName] - Name of the user asking
 * @returns {Promise<string>} The generated response text
 */
export async function generateGeminiReply({
  prompt,
  history = [],
  senderName = 'Participant',
}) {
  const effectiveKey = process.env.GEMINI_API_KEY;

  if (!effectiveKey || effectiveKey.trim() === '') {
    throw new Error('Aura AI is not configured. Set GEMINI_API_KEY in the backend environment.');
  }

  // Format conversational context from recent meeting chat
  const contextMessages = history
    .slice(-10) // Last 10 messages for context
    .map((msg) => `${msg.senderName || 'Participant'}: ${msg.content}`)
    .join('\n');

  const fullPrompt = contextMessages
    ? `Recent in-meeting chat discussion:\n${contextMessages}\n\n${senderName} asks/says: ${prompt}`
    : `${senderName} asks/says: ${prompt}`;

  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': effectiveKey.trim(),
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`[Gemini API] Model ${model} returned ${response.status}:`, errorData);
      const errorMessage = errorData.error?.message || '';
      const modelUnavailable =
        response.status === 404 ||
        /model .* (not found|not supported)|not supported for generatecontent/i.test(errorMessage);
      if (modelUnavailable && index < models.length - 1) continue;
      throw new Error(errorMessage || `Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Gemini returned an empty response.');
    return reply.trim();
  }

  throw new Error(`Gemini model ${models[0]} is unavailable.`);
}
