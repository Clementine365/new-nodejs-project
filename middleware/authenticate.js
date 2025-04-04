

// middleware/authenticate.js

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

module.exports = { isAuthenticated }; // Exporting correctly
