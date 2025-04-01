const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const passport = require("passport");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Passport GitHub OAuth Strategy
passport.use(new (require('passport-github2').Strategy)({
  clientID: process.env.GITHUB_CLIENT_ID,  // Your GitHub OAuth Client ID
  clientSecret: process.env.GITHUB_CLIENT_SECRET,  // Your GitHub OAuth Client Secret
  callbackURL: process.env.CALLBACK_URL,  // The redirect URI after GitHub auth
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { email } = profile._json; // GitHub email
    const user = await User.findOne({ email });
    if (user) {
      return done(null, user);  // User exists, authenticate them
    }
    // If user doesn't exist, create a new one
    const newUser = new User({
      name: profile.displayName,
      email: email,
      password: "N/A",  // Since GitHub login doesn't require a password
    });
    await newUser.save();
    return done(null, newUser);  // Successfully created a new user
  } catch (err) {
    return done(err, false);  // Error handling
  }
}));

// Serialize and deserialize user to/from session
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Login Route for OAuth (GitHub)
router.get("/login", passport.authenticate("github", { scope: ["user:email"] }));

// GitHub Callback Route after successful authentication
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful login, you can issue a JWT token or set a session
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || "your_jwt_secret", { expiresIn: "1h" });
    res.status(200).json({ message: "Logged in successfully", token });
  }
);

// Register Route
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("age").isInt({ min: 18 }).withMessage("Age must be greater than 17"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, age } = req.body;

    try {
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({ name, email, password: hashedPassword, age });
      await newUser.save();

      res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (err) {
      res.status(500).json({ message: "Error creating user", error: err.message });
    }
  }
);

// Login Route for traditional email/password (with JWT)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Logout Route (optional)
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;
