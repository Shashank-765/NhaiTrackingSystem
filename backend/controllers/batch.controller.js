const Batch = require("../models/batch.model");
const Pusher = require("pusher");
require("dotenv").config();

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const createBatch = async (req, res) => {
  try {
    const {
      contractTitle,
      contractId,
      bidValue,
      contractorValue,
      bidDuration,
      agencyId,
      agencyName,
      contractorId,
      contractorName,
      status,
    } = req.body;

    // Check if batch with same contractId already exists
    const existingBatch = await Batch.findOne({ contractId });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: "Batch with this Contract ID already exists",
      });
    }
    // Create new batch
    const newBatch = new Batch({
      contractTitle,
      contractId,
      bidValue,
      contractorValue,
      bidDuration,
      agencyName,
      agencyId,
      contractorName,
      contractorId,
      status,
    });

    await newBatch.save();

    await pusher.trigger(
      "agency-channel",
      `batch-created-${newBatch.agencyId}`,
      {
        id: `batch-created-${Date.now()}`,
        message: `Contract of ${newBatch.contractTitle} has been created!`,
        timestamp: new Date().toISOString(),
        type: "batch-creation",
        batchId: newBatch._id,
      }
    );
    
    // try {
    //   const notificationData = {
    //     id: `batch-${Date.now()}`,
    //     message: `New batch "${contractTitle}" has been created for you with contractor ${contractorName}`,
    //     timestamp: new Date().toISOString(),
    //     type: "batch-creation",
    //     batchId: newBatch._id,
    //     contractTitle: contractTitle,
    //     contractorName: contractorName,
    //     bidValue: bidValue,
    //     bidDuration: bidDuration
    //   };
      
    //   console.log('Notification payload:', notificationData);
      
    //   const result = await pusher.trigger(
    //     "agency-channel",
    //     `batch-created-${agencyId}`,
    //     notificationData
    //   );
      
    //   console.log('=== Notification Sent ===');
    //   console.log('Pusher trigger result:', result);
    //   console.log('Response status:', result.status);
    //   console.log('Response headers:', result.headers);
    //   console.log('Time sent:', new Date().toISOString());
      
    //   // Log webhook events if any
    //   pusher.webhook((event) => {
    //     console.log('=== Webhook Event After Trigger ===');
    //     console.log('Event:', event);
    //   });

    // } catch (pusherError) {
    //   console.error('=== Notification Error ===');
    // }
    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: newBatch,
    });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: "Error creating batch",
    });
  }
};

const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find();
    res.status(200).json({
      success: true,
      data: batches,
    });
  } catch (error) {
      res.status(500).json({
      success: false,
      message: "Error fetching batches",
      error: error.message,
    });
  }
};

const getBatchById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid MongoDB ID format");
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID format",
      });
    }

    const batch = await Batch.findById(req.params.id);
    console.log("Found batch:", batch);

    if (!batch) {
      console.log("Batch not found");
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    console.log("Sending batch data");
    res.status(200).json({
      success: true,
      data: batch,
    });
  } catch (error) {
    console.error("Error in getBatchById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching batch details",
    });
  }
};

const updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approval status is allowed",
      });
    }

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    if (batch.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending batches can be approved",
      });
    }

    batch.status = status;
    await batch.save();

    // Send notification to contractor for this batch
    await pusher.trigger(
      "contractor-channel",
      `batch-approved-${batch.contractorId}`,
      {
        id: `batch-approved-${Date.now()}`,
        message: `Contract of ${batch.contractTitle} has been given to you!`,
        timestamp: new Date().toISOString(),
        type: "batch-approval",
        batchId: batch._id,
      }
    );

    // Send notification to agency for this batch
    // await pusher.trigger("agency-channel", `batch-approved-${batch.agencyId}`, {
    //   id: `batch-approved-${Date.now()}`,
    //   message: `Contract for ${batch.contractTitle} has been given to ${batch.contractorName}!`,
    //   timestamp: new Date().toISOString(),
    //   type: "batch-approval",
    //   batchId: batch._id,
    // });

    // Send notification to admin for this batch
    await pusher.trigger("admin-channel", `batch-approved-${batch.adminId}`, {
      id: `batch-approved-${Date.now()}`,
      message: `Contract for ${batch.contractTitle} has been given to ${batch.contractorName}!`,
      timestamp: new Date().toISOString(),
      type: "batch-approval",
      batchId: batch._id,
    });

    res.status(200).json({
      success: true,
      message: "Batch status updated successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error in updateBatchStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error updating batch status",
    });
  }
};

const updateWorkDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { workStatus, workDetails } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    const previousStatus = batch.workStatus;
    batch.workStatus = workStatus;
    batch.workDetails = workDetails;

    // If work status changed to completed, record the completion time
    if (workStatus === "completed" && previousStatus !== "completed") {
      batch.completedAt = new Date();
      // Trigger Pusher notification
      await pusher.trigger("admin-channel", "work-completed", {
        message: `${batch.contractorName} has finished ${batch.contractTitle}`,
        batchId: batch._id,
        contractorName: batch.contractorName,
        batchTitle: batch.contractTitle,
        completedAt: batch.completedAt,
      });

      await pusher.trigger(
        `agency-channel`,
        `work-completed-${batch.agencyId}`,
        {
          //id so that notification is sent to that particular agency
          id: `work-${Date.now()}`, // Add an ID for the notification
          message: `${batch.contractorName} has finished ${batch.contractTitle}`,
          batchId: batch._id,
          contractorName: batch.contractorName,
          batchTitle: batch.contractTitle,
          completedAt: batch.completedAt,
          timestamp: new Date().toISOString(),
          type: "work-completion",
        }
      );
      // console.log('Pusher notification sent successfully');
    }

    await batch.save();

    res.status(200).json({
      success: true,
      message: "Work details updated successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error in updateWorkDetails:", error);
    res.status(500).json({
      success: false,
      message: "Error updating work details",
    });
  }
};

const approveWork = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    if (batch.workStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot approve work that is not completed",
      });
    }
    batch.workApproved = true;
    await batch.save();

    // Trigger notification to contractor
    await pusher.trigger(
      "contractor-channel",
      `work-approved-${batch.contractorId}`,
      {
        id: `app-${Date.now()}`,
        message: `Your work for ${batch.contractTitle} has been approved. You can now download the invoice.`,
        timestamp: new Date().toISOString(),
        type: "work-approval",
        batchId: batch._id,
      }
    );

    await pusher.trigger("agency-channel", `work-approved-${batch.agencyId}`, {
      id: `app-${Date.now()}`,
      message: `Batch work for ${batch.contractTitle} has been approved.`,
      timestamp: new Date().toISOString(),
      type: "work-approval",
      batchId: batch._id,
    });

    res.status(200).json({
      success: true,
      message: "Work approved successfully",
      data: batch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// download invoice
const downloadInvoice = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    const { role } = req.user;
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    if (!batch.invoiceDownloaded) {
      return res.status(403).json({
        success: false,
        message:
          "Contractor must download the invoice before admin can access it.",
      });
    }

    // Logic to generate and send invoice PDF/file
    // For example:
    // const invoicePDF = await generatePDF(batch);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.send(invoicePDF);

    return res.status(200).json({
      success: true,
      message: "Invoice downloaded successfully (admin).",
      // data: invoicePDF
    });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updatePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, transactionDate, transactionType } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    if(transactionType === 'agency_to_nhai') {
      batch.agencyToNhaiTransactionId = transactionId;
      batch.agencyToNhaiTransactionDate = transactionDate;
      if (req.file) {
        batch.agencyToNhaiPaymentMedia = `/payment-media/${req.file.filename}`;
      }
      batch.agencyToNhaiPaymentStatus = "completed";

      // Add notification for admin when agency pays NHAI
      await pusher.trigger("admin-channel", "agency-payment-received", {
        id: `agency-payment-${Date.now()}`,
        message: `Payment received from ${batch.agencyName} for contract: ${batch.contractTitle}`,
        timestamp: new Date().toISOString(),
        type: "agency-payment",
        batchId: batch._id,
        agencyName: batch.agencyName,
        contractTitle: batch.contractTitle,
        amount: batch.bidValue
      });
    } else if(transactionType === 'nhai_to_contractor') {
      batch.nhaiToContractorTransactionId = transactionId;
      batch.nhaiToContractorTransactionDate = transactionDate;
      if (req.file) {
        batch.nhaiToContractorPaymentMedia = `/payment-media/${req.file.filename}`;
      }
      batch.nhaiToContractorPaymentStatus = "completed";
    }
    // batch.transactionTime = new Date();
    // batch.paymentStatus = "completed";

    batch.updatedAt = new Date();
    

    // Handle media upload
    // if (req.file) {
    //   batch.paymentMedia = `/payment-media/${req.file.filename}`;
    // }

    await batch.save();

    // Send notification to agency about payment completion
    await pusher.trigger("admin-channel", `batch-approved-${batch.adminId}`, {
      id: `batch-approved-${Date.now()}`,
      message: `Contract for ${batch.contractTitle} has been given to ${batch.contractorName}!`,
      timestamp: new Date().toISOString(),
      type: "payment",
      batchId: batch._id,
    });

    // Send notification to contractor about payment completion
    // await pusher.trigger(
    //   "contractor-channel",
    //   `payment-completed-${batch.contractorId}`,
    //   {
    //     id: `pay-${Date.now()}`,
    //     message: `Payment completed for your work on ${batch.contractTitle}`,
    //     timestamp: new Date().toISOString(),
    //     type: "payment",
    //     batchId: batch._id,
    //   }
    // );

    res.status(200).json({
      success: true,
      message: "Payment information updated successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error in updatePaymentInfo:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment information",
    });
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatchStatus,
  updateWorkDetails,
  approveWork,
  downloadInvoice,
  updatePaymentInfo,
};
