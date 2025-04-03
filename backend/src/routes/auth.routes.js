const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateLogin, validateRegister } = require('../middleware/validators/auth.validator');

// Login route
router.post('/login', validateLogin, authController.login);

// Register route (for creating new users within a tenant)
router.post('/register', validateRegister, authController.register);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password/:token', authController.resetPassword);

// Verify email
router.get('/verify-email/:token', authController.verifyEmail);

// Get current user profile
router.get('/me', authController.getCurrentUser);

module.exports = router;
