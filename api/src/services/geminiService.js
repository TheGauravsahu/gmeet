/**
 * Gemini AI Service for Aura Meeting Assistant
 * Handles Aura AI queries through Google's Interactions API.
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

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': effectiveKey.trim(),
    },
    body: JSON.stringify({
      model: 'gemini-3.5-flash-lite',
      system_instruction: SYSTEM_INSTRUCTION,
      input: fullPrompt,
      store: false,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    let errorData = {};
    try {
      errorData = JSON.parse(responseBody);
    } catch {
      errorData = { message: responseBody };
    }
    const errorMessage = errorData.error?.message || errorData.message || '';
    console.error(`[Gemini API] Interactions request returned ${response.status}:`, errorData);
    throw new Error(errorMessage || `Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const outputText =
    data.output_text ||
    data.steps
      ?.filter((step) => step.type === 'model_output')
      .flatMap((step) => step.content || [])
      .filter((part) => typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n');

  if (!outputText) throw new Error('Gemini returned an empty response.');
  return outputText.trim();
}
