const ClaudeProvider = require("./ClaudeProvider");
const GeminiProvider = require("./GeminiProvider");
// Para añadir un nuevo proveedor: importarlo aquí y añadirlo al array

const providers = [new ClaudeProvider(), new GeminiProvider()];
const map = new Map(providers.map(p => [p.id(), p]));

function getProvider(id) {
  const p = map.get(id);
  if (!p) throw new Error(`Proveedor "${id}" no soportado. Disponibles: ${[...map.keys()].join(", ")}`);
  return p;
}
function listProviders() { return providers.map(p => ({ id: p.id(), label: p.label() })); }
module.exports = { getProvider, listProviders };
