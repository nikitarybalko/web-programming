const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["solar_engineer", "wind_engineer", "coordinator"],
    required: true,
  },
  apiKey: { type: String },
});

module.exports = mongoose.model("User", userSchema);
