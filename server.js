const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize the express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Import routes for user data
const userRoutes = require('./routes/userRoutes'); // Import the userRoutes
app.use('/api/users', userRoutes); // Use userRoutes for "/api/users" route

// Connect to MongoDB with updated connection string and options
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected!");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err.message);
        process.exit(1); // Exit the process if there's an error connecting
    });



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
