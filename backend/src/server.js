require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analyzeRouter = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use("/api", analyzeRouter);
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
