const express = require("express");
const multer = require("multer");
const { getParserFor, getSupportedExtensions } = require("../parsers");
const { getProvider, listProviders } = require("../providers");
const { buildAnalysisPrompt, parseAnalysisResponse } = require("../utils/analysisPrompt");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get("/providers", (req, res) => res.json({ providers: listProviders() }));
router.get("/formats", (req, res) => res.json({ formats: getSupportedExtensions() }));

router.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    const { provider: providerId, apiKey } = req.body;
    if (!req.file) return res.status(400).json({ error: "No se recibió ningún archivo" });
    if (!providerId) return res.status(400).json({ error: "Falta el campo 'provider'" });

    const parser = getParserFor(req.file.originalname);
    const { rows, columns, rowCount } = await parser.parse(req.file.buffer, { originalName: req.file.originalname });
    if (!rowCount) return res.status(422).json({ error: "El archivo no contiene datos" });

    const provider = getProvider(providerId);
    const prompt = buildAnalysisPrompt({ rows, columns, rowCount });
    const rawText = await provider.generate(prompt, { apiKey });
    const analysis = parseAnalysisResponse(rawText);

    res.json({ fileName: req.file.originalname, provider: providerId, analysis });
  } catch (err) {
    console.error("Error en /analyze:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
