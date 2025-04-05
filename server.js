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
const User = require("./models/users");
const userRoutes = require("./routes/userRoutes");
// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Session and Passport setup
app.use(session({
  secret: "secret", // Move to env in production
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// GitHub Strategy
passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ["user:email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔍 GitHub Profile:", JSON.stringify(profile, null, 2));
    console.log("📨 Emails:", profile.emails);

    const githubId = profile.id;
    const name = profile.displayName || profile.username || "GitHub User";

    let email = null;

    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    }

    if (!email && profile.username) {
      email = `${profile.username}@github.local`;
    }

    if (!githubId || !email) {
      return done(new Error("Missing GitHub ID or email"), null);
    }

    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.create({ githubId, name, email, age: 18 });
    }

    return done(null, user);
  } catch (err) {
    console.error("❌ GitHub Strategy Error:", err);
    return done(err, null);
  }
}));

// Serialize/Deserialize
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.get("/login", (req, res) => res.render("login"));

app.get("/login/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get("/github/callback", passport.authenticate("github", {
  failureRedirect: "/login"
}), (req, res) => {
  req.session.user = req.user;
  res.redirect("/");
});

app.get("/", async (req, res) => {
  if (req.session.user) {
    try {
      const users = await User.find();  // Fetch all users from the database
      res.status(200).json({ message: `Logged in as ${req.session.user.name}`, users: users });
    } catch (err) {
      res.status(500).json({ message: "Error fetching users", error: err.message });
    }
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});


app.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect("/");
  });
});
// Register the user routes
app.use("/api/users", userRoutes);


// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
