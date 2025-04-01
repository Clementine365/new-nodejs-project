const mongoose = require("mongoose");

// Define the schema for a user
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    githubId: { type: String, required: true, unique: true }, // Store GitHub user ID
    createdAt: { type: Date, default: Date.now }
});

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
