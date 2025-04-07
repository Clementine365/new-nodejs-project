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

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://new-nodejs-project.onrender.com'  // Production frontend URL (Replace with your Render URL)
    : 'http://localhost:5003',  // Local development frontend URL (Replace with your local URL)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
  credentials: true,  // Allow cookies and session data to be sent with requests
};

const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://new-nodejs-project.onrender.com' 
  : 'http://localhost:5003';

swaggerFile.host = baseUrl; // Modify the host dynamically based on the environment

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

passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  // Dynamically set the callbackURL based on the environment (production or development)
  callbackURL: process.env.NODE_ENV === 'production' 
    ? 'https://new-nodejs-project.onrender.com/github/callback' // Render production URL
    : 'http://localhost:5002/github/callback', // Local development URL
  scope: ["user:email"] // Scope to access user email
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("🔍 GitHub Profile:", JSON.stringify(profile, null, 2));
    console.log("📨 Emails:", profile.emails);

    const githubId = profile.id;
    const name = profile.displayName || profile.username || "GitHub User";

    let email = null;

    // Get the first email from the profile if available
    if (profile.emails && profile.emails.length > 0) {
      email = profile.emails[0].value;
    }

    // If no email found, use the GitHub username as a fallback email
    if (!email && profile.username) {
      email = `${profile.username}@github.local`;
    }

    // If no GitHub ID or email, return an error
    if (!githubId || !email) {
      return done(new Error("Missing GitHub ID or email"), null);
    }

    // Check if the user already exists in the database
    let user = await User.findOne({ githubId });

    if (!user) {
      // If the user doesn't exist, create a new one
      user = await User.create({ githubId, name, email, age: 18 });
    }

    return done(null, user); // Proceed with the user object
  } catch (err) {
    console.error("❌ GitHub Strategy Error:", err);
    return done(err, null); // Handle error if something goes wrong
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
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(require("./swagger-output.json")));

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
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
