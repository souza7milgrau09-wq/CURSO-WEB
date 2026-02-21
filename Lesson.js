const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  titulo: String,
  videoUrl: String,
  modulo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module"
  },
  ordem: Number
});

module.exports = mongoose.model("Lesson", LessonSchema);