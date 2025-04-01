const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const GithubStrategy = require("passport-github2").Strategy;

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Auth routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// User routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

// Express session and Passport initialization
app.use(session({
  secret: "secret", // You may want to change this secret key
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Define routes

// Login page route
app.get("/login", (req, res) => {
  res.render("login"); // Ensure you have a "login.ejs" file in the "views" folder
});

// GitHub OAuth Routes
app.get("/login/github", passport.authenticate("github", { scope: ["user:email"] }));

// GitHub OAuth callback route
app.get("/github/callback", passport.authenticate("github", {
  failureRedirect: "/login",
  session: false, // No session persistence for OAuth
}), (req, res) => {
  req.session.user = req.user;
  res.redirect("/"); // Redirect to home or another route
});

// Home route (for testing)
app.get("/", (req, res) => {
  res.send(req.session.user ? `Logged in as ${req.session.user.displayName}` : "Logged out");
});

// GitHub Passport strategy configuration
passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
}, function (accessToken, refreshToken, profile, done) {
  return done(null, profile); // Serialize the user profile
}));

// Serialize and deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// User-related CRUD routes
const User = require("./models/users");
app.get("/", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from MongoDB
    res.json({ message: "Users fetched successfully!", users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users from the database." });
  }
});

// Create a new user (POST)
app.post("/", async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const newUser = new User({ name, email, age });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user." });
  }
});

// Update an existing user by ID (PUT)
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, { name, email, age }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.json({ message: "User updated successfully!", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user." });
  }
});

// Delete a user by ID (DELETE)
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user." });
  }
});

// Set up the server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});








