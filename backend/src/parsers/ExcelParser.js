const XLSX = require("xlsx");
const BaseParser = require("./BaseParser");

class ExcelParser extends BaseParser {
  extensions() { return ["xlsx", "xls"]; }
  async parse(buffer, meta) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    return { rows, columns: rows.length ? Object.keys(rows[0]) : [], rowCount: rows.length };
  }
}
module.exports = ExcelParser;
