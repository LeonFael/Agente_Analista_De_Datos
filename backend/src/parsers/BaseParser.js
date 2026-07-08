class BaseParser {
  extensions() { throw new Error("extensions() no implementado"); }
  async parse(buffer, meta) { throw new Error("parse() no implementado"); }
}
module.exports = BaseParser;
