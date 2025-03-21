const Item = require('../models/Item');

// Get all items from the database
exports.getItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching items", error: error.message });
    }
};

// Create a new item in the database now
exports.createItem = async (req, res) => {
    const { name, description, price } = req.body;
    
    if (!name || !description || !price) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const newItem = new Item({ name, description, price });
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: "Error creating item", error: error.message });
    }
};
