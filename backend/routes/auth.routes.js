const express = require('express');
const { login } = require('../controllers/auth.controller');
const { validateLogin } = require('../middleware/validators');

const router = express.Router();

router.post('/login', validateLogin, login);

module.exports = router;
