const express = require('express');
const router = express.Router();
const { createBatch, getAllBatches, getBatchById, updateBatchStatus, updateWorkDetails, approveWork, updatePaymentInfo, updateMilestoneStatus, downloadInvoice } = require('../controllers/batch.controller');
const { protect, isAdmin } = require('../middleware/auth.middleware');
const Batch = require('../models/batch.model');
const Pusher = require('pusher');
const multer = require('multer');
const path = require('path');

// Initialize Pusher
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

// Multer config for payment media upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/payment-media'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `payinfo_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image (jpg, jpeg, png) or PDF files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }
});

// Get all batches
router.get('/', protect, getAllBatches);

// Get a single batch by ID
router.get('/:id', getBatchById);

// Create a new batch (protected route)
router.post('/create', protect, createBatch);

// Update batch status (protected route)
router.patch('/:id/status', protect, updateBatchStatus);

// Update work details (protected route)
router.patch('/:id/work-details', protect, updateWorkDetails);

// Approve work on a batch (protected route)
router.patch('/:id/approve-work', protect, isAdmin, approveWork);

// Update payment information (admin only, with media upload)
// router.patch('/:id/payment', protect, isAdmin, upload.single('media'), updatePaymentInfo);
router.patch('/:id/payment', protect, upload.single('media'), updatePaymentInfo);

// Invoice download - handles tracking, notification, and permission
router.get('/:id/invoice/download', protect, downloadInvoice);

// Update milestone status (protected route)
router.patch('/:id/milestone-status', updateMilestoneStatus);

module.exports = router;
