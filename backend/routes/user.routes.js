const express = require('express');
const { createUser, getUsers, getAllUsers } = require('../controllers/user.controller');
const { validateCreateUser } = require('../middleware/validators');
const { protect, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);
router.use(isAdmin);

router.route('/')
    .post(validateCreateUser, createUser)
    .get(getUsers);

router.get('/all', getAllUsers);

module.exports = router;
