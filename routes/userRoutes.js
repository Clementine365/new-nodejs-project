const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you have a User model
const { body, validationResult } = require('express-validator');

// Route to get all users (GET)
router.get('/', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users
        res.status(200).json(users); // Return all users
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});

// Route to get a user by ID (GET)
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

// Route to create a new user (POST)
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

    const { name, email, age } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email, age }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);  // Successfully updated user
    } catch (err) {
        res.status(500).json({ message: 'Error updating user', error: err.message });
    }
});

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
