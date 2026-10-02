/**
 * Gemini AI Service for Aura Meeting Assistant
 * Handles queries to Google Gemini API (gemini-2.5-flash / gemini-1.5-flash)
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
 * @param {string} [options.apiKey] - Optional custom API key from client or env
 * @param {string} [options.roomCode] - Meeting room identifier
 * @param {string} [options.senderName] - Name of the user asking
 * @returns {Promise<string>} The generated response text
 */
export async function generateGeminiReply({
  prompt,
  history = [],
  apiKey = null,
  roomCode = '',
  senderName = 'Participant',
}) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey || effectiveKey.trim() === '') {
    return (
      `✨ **Aura AI:** Hello ${senderName}! I'm ready to assist in meeting #${roomCode}. ` +
      `To activate live Gemini responses, please set your \`GEMINI_API_KEY\` in \`api/.env\` or enter it in the chat settings.`
    );
  }

  // Format conversational context from recent meeting chat
  const contextMessages = history
    .slice(-10) // Last 10 messages for context
    .map((msg) => `${msg.senderName || 'Participant'}: ${msg.content}`)
    .join('\n');

  const fullPrompt = contextMessages
    ? `Recent in-meeting chat discussion:\n${contextMessages}\n\n${senderName} asks/says: ${prompt}`
    : `${senderName} asks/says: ${prompt}`;

  // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if needed
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey.trim()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        // If 404 on 2.5-flash, loop to 1.5-flash
        if (response.status === 404 && model !== models[models.length - 1]) {
          continue;
        }
        throw new Error(errorData.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (reply) {
        return reply.trim();
      }
    } catch (err) {
      console.error(`[Gemini API] Error calling ${model}:`, err.message);
      if (model === models[models.length - 1]) {
        return `✨ **Aura AI:** Sorry, I encountered an issue connecting to Gemini: ${err.message}. Please verify your API key.`;
      }
    }
  }

  return "✨ **Aura AI:** I'm here! Could you please repeat that?";
}
