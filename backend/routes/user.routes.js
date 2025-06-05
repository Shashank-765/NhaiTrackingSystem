const express = require('express');
const { createUser, getUsers } = require('../controllers/user.controller');
const { validateCreateUser } = require('../middleware/validators');
const { protect, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(isAdmin); // Only admin can access these routes

router.route('/')
    .post(validateCreateUser, createUser)
    .get(getUsers);

module.exports = router;
