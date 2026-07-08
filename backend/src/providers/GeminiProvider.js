const BaseProvider = require("./BaseProvider");

class GeminiProvider extends BaseProvider {
  id() { return "gemini"; }
  label() { return "Gemini (Google)"; }
  async generate(prompt, options = {}) {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No hay API key de Gemini configurada");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1 } })
    });
    if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini no devolvió texto");
    return text;
  }
}
module.exports = GeminiProvider;
