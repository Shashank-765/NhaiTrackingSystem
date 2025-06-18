const express = require('express');
const router = express.Router();
const { createBatch, getAllBatches, getBatchById, updateBatchStatus, updateWorkDetails, approveWork, updatePaymentInfo, updateMilestoneStatus } = require('../controllers/batch.controller');
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
router.get('/:id', protect, (req, res, next) => {
    console.log('GET /:id route hit');
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('Headers:', req.headers);
    next();
}, getBatchById);

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

// Track invoice downloads
router.patch('/:id/track-invoice-download', protect, async (req, res) => {
    try {
        const batch = await Batch.findByIdAndUpdate(
            req.params.id,
            // { invoiceDownloaded: true },
            {adminInvoiceDownloaded: true}, // Update both flags
            { new: true }
        );

        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        res.status(200).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Notify invoice download
router.post('/:id/notify-invoice-download', protect, async (req, res) => {
    try {
        const batch = await Batch.findById(req.params.id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const timestamp = new Date();
        
        // Trigger Pusher notification with more detailed information
        await pusher.trigger('admin-channel', 'invoice-downloaded', {
            id: `inv-${Date.now()}`, // Unique ID for the notification
            message: `${batch.contractorName} has downloaded invoice for ${batch.contractTitle}`,
            batchId: batch._id,
            contractorName: batch.contractorName,
            contractTitle: batch.contractTitle,
            timestamp: timestamp.toISOString()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// admin download invoice route (not before contractor)
router.get('/:id/admin-invoice-download', protect, isAdmin, async (req, res) => {
    try {
      const batch = await Batch.findById(req.params.id);
  
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
  
      if (!batch.invoiceDownloaded) {
        return res.status(403).json({
          success: false,
          message: 'Contractor must download the invoice before admin can access it.'
        });
      }
  
      // If invoice download is allowed, return success or actual file
      // Replace with your actual logic if generating or sending a PDF
      res.status(200).json({
        success: true,
        message: 'Admin invoice download permitted.',
        data: {
          contractTitle: batch.contractTitle,
          contractorName: batch.contractorName,
          bidValue: batch.bidValue,
          // ... add more fields as needed
        }
      });
  
    } catch (error) {
      console.error('Admin invoice download error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
  
// Update milestone status (protected route)
router.patch('/:id/milestone-status', protect, updateMilestoneStatus);

module.exports = router;
