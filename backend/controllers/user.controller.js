const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const { sendCredentials } = require('../services/mail/mailService');
const bcrypt = require('bcryptjs');

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, phone, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            role
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                uniqueId: user.uniqueId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

        // Send credentials email (do not block response on failure)
        sendCredentials(
            email,
            name,
            user.uniqueId,
            password,
            role
        ).catch(err => {
            console.error('Failed to send credentials email:', err);
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page -1) * limit;
        const users = await User.find().skip(skip).limit(limit)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users,
           pagination: {
            currentPage: page,
            totalUsers: await User.countDocuments(),
            totalPages: Math.ceil(await User.countDocuments() / limit),
            hasNextPage: (page * limit) < await User.countDocuments(),
            hasPreviousPage: page > 1,
            nextPage: (page * limit) < await User.countDocuments() ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
        }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ name: 1 }); // Sort by name alphabetically

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};
