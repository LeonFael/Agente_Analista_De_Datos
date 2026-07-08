function buildAnalysisPrompt({ rows, columns, rowCount }) {
  const sample = JSON.stringify(rows.slice(0, 80));
  return `Analiza este dataset y responde ÚNICAMENTE con JSON válido, sin texto extra, sin markdown, sin backticks.

Columnas: ${columns.join(", ")}
Total filas: ${rowCount}
Muestra: ${sample}

Responde con esta estructura exacta:
{
  "summary": {
    "titulo": "título descriptivo",
    "totalFilas": número,
    "totalColumnas": número,
    "periodo": "rango si aplica o null",
    "descripcion": "2-3 oraciones sobre el dataset",
    "insights": ["hallazgo 1", "hallazgo 2", "hallazgo 3"]
  },
  "charts": [
    {
      "id": "chart1",
      "tipo": "bar|line|pie",
      "titulo": "título",
      "descripcion": "qué muestra",
      "datos": [{"label":"...", "valor": número}]
    }
  ]
}

Genera exactamente 5 gráficos con datos reales. Barras/líneas: máximo 10 puntos. Pie: máximo 6 categorías. Mínimo 1 line, 1 pie, 3 bar.`;
}

function parseAnalysisResponse(raw) {
  const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(clean); }
  catch { throw new Error("La IA no devolvió JSON válido. Intenta de nuevo."); }
}

module.exports = { buildAnalysisPrompt, parseAnalysisResponse };
