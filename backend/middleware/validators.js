const { check } = require('express-validator');

exports.validateLogin = [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

exports.validateCreateUser = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    check('phone')
        .matches(/\d{10}/)
        .withMessage('Please enter a valid 10-digit phone number'),
    check('role')
        .isIn(['Agency', 'Contractor'])
        .withMessage('Role must be either Agency or Contractor')
];
