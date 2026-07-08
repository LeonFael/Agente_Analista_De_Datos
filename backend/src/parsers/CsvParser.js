const Papa = require("papaparse");
const BaseParser = require("./BaseParser");

class CsvParser extends BaseParser {
  extensions() { return ["csv"]; }
  async parse(buffer) {
    const result = Papa.parse(buffer.toString("utf-8"), { header: true, skipEmptyLines: true, dynamicTyping: true });
    return { rows: result.data, columns: result.meta.fields || [], rowCount: result.data.length };
  }
}
module.exports = CsvParser;
