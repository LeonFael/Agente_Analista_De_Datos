class BaseProvider {
  id() { throw new Error("id() no implementado"); }
  label() { throw new Error("label() no implementado"); }
  async generate(prompt, options) { throw new Error("generate() no implementado"); }
}
module.exports = BaseProvider;
