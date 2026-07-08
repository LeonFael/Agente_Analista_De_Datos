const BaseProvider = require("./BaseProvider");

class ClaudeProvider extends BaseProvider {
  id() { return "claude"; }
  label() { return "Claude (Anthropic)"; }
  async generate(prompt, options = {}) {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("No hay API key de Anthropic configurada");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2500, messages: [{ role: "user", content: prompt }] })
    });
    if (!res.ok) throw new Error(`Claude API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const block = data.content?.find(b => b.type === "text");
    if (!block) throw new Error("Claude no devolvió texto");
    return block.text;
  }
}
module.exports = ClaudeProvider;
