const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, unique: true },
  senha: String,
  pago: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);