const CsvParser = require("./CsvParser");
const ExcelParser = require("./ExcelParser");
// Para añadir un nuevo formato: importarlo aquí y añadirlo al array

const parsers = [new CsvParser(), new ExcelParser()];
const map = new Map();
for (const p of parsers) for (const ext of p.extensions()) map.set(ext.toLowerCase(), p);

function getParserFor(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const parser = map.get(ext);
  if (!parser) throw new Error(`Formato ".${ext}" no soportado. Disponibles: ${[...map.keys()].join(", ")}`);
  return parser;
}
function getSupportedExtensions() { return [...map.keys()]; }
module.exports = { getParserFor, getSupportedExtensions };
