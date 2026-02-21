const mongoose = require("mongoose");

const ModuleSchema = new mongoose.Schema({
  titulo: String,
  descricao: String,
  ordem: Number
});

module.exports = mongoose.model("Module", ModuleSchema);