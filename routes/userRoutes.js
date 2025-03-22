const express = require('express');
const router = express.Router();
const User = require('../models/users'); // to call a User model
const { body, validationResult } = require('express-validator');

// this is Route to get all users (GET)
router.get('/', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users
        res.status(200).json(users); // Return all users
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// this is the Route to get a user by ID (GET)
router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
});

// this is the Route to create a new user (POST)
router.post('/', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('age').isInt({ min: 18 }).withMessage('Age must be a number greater than 17')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, age } = req.body;

    try {
        const newUser = new User({ name, email, age });
        await newUser.save();
        res.status(201).json(newUser);  // Created a new user
    } catch (err) {
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
});

// Route to update a user by ID (PUT)
router.put('/:id', [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('age').optional().isInt({ min: 18 }).withMessage('Age must be a number greater than 17')
], async (req, res) => {
    const userId = req.params.id;

    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get updated values from the request body
    const { name, email, age } = req.body;

    // Prepare the updated data, only include non-null fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (age) updateData.age = age;

    try {
        // Find user by ID and update their details
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with the updated user data (excluding the password)
        const userResponse = { ...updatedUser.toObject() };
        delete userResponse.password; // Do not send the password back in the response
        res.status(200).json(userResponse);  // Successfully updated user
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

module.exports = router;

// Route to delete a user by ID (DELETE)
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });  // Successfully deleted user
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user', error: err.message });
    }
});

module.exports = router;
