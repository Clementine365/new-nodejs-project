const express = require("express");
const router = express.Router();
const User = require("../models/users");
const { body, validationResult } = require("express-validator");
const { isAuthenticated } = require("../middleware/authenticate");  // Correct import

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for managing users
 */

// GET all users
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

// GET user by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// CREATE user
// GET user by ID
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// CREATE user
router.post(
  "/",
  isAuthenticated,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("age").isInt({ min: 18 }).withMessage("Age must be at least 18"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, age } = req.body;
      // Check if the email already exists in the database
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const newUser = new User({ name, email, age });
      await newUser.save();
      res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (err) {
      res.status(500).json({ message: "Error creating user", error: err.message });
    }
  }
);

// UPDATE user
router.put("/:id", isAuthenticated, async (req, res) => {
  const { name, email, age } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (age) updates.age = age;

  // If no update fields are provided, return a bad request
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No data to update" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
});

// DELETE user
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

module.exports = router;
