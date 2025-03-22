const User = require('../models/users');

// Get all users from the database
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.status(200).json(users); // Return the list of users
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// Create a new user in the database
exports.createUser = async (req, res) => {
    const { name, email, password } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields (name, email, password) are required" });
    }

    try {
        // Check if a user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Create a new user instance
        const newUser = new User({ name, email, password });

        // Save the new user to the database
        await newUser.save();

        // Respond with the newly created user data (excluding password)
        const userResponse = { ...newUser.toObject() };
        delete userResponse.password; // Don't send the password back

        res.status(201).json(userResponse); // Return the created user
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};
