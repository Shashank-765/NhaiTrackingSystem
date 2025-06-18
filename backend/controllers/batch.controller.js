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
      milestones
    } = req.body;

    // Check if batch with same contractId already exists
    const existingBatch = await Batch.findOne({ contractId });
    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: "Batch with this Contract ID already exists",
      });
    }

    // Validate milestones if provided
    if (milestones && Array.isArray(milestones)) {
      for (const milestone of milestones) {
        // Check required fields
        if (!milestone.heading || !milestone.amount || !milestone.startDate || !milestone.endDate || !milestone.contractorId || !milestone.contractorName) {
          return res.status(400).json({
            success: false,
            message: "Each milestone must have a heading, amount, start date, end date, and contractor information",
          });
        }

        // Validate dates
        const startDate = new Date(milestone.startDate);
        const endDate = new Date(milestone.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format for milestone dates",
          });
        }

        if (endDate < startDate) {
          return res.status(400).json({
            success: false,
            message: "End date must be after start date for each milestone",
          });
        }

        // Convert string dates to Date objects
        milestone.startDate = startDate;
        milestone.endDate = endDate;
      }
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
      milestones: milestones || []
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalBatches = await Batch.countDocuments();
    const batches = await Batch.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: batches,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBatches / limit),
        totalItems: totalBatches,
        itemsPerPage: limit
      }
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
    if (!batch) {
      console.log("Batch not found");
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

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

    // Validate work status progression
    const validStatuses = ["pending", "30_percent", "80_percent", "completed"];
    const currentIndex = validStatuses.indexOf(batch.workStatus);
    const newIndex = validStatuses.indexOf(workStatus);

    if (newIndex < currentIndex) {
      return res.status(400).json({
        success: false,
        message: "Cannot revert to a previous work status",
      });
    }

    const previousStatus = batch.workStatus;
    batch.workStatus = workStatus;
    batch.workDetails = workDetails;

    // Handle notifications based on work status changes
    if (workStatus !== previousStatus) {
      let notificationMessage = "";
      
      switch (workStatus) {
        case "30_percent":
          notificationMessage = `${batch.contractorName} has completed 30% of ${batch.contractTitle}`;
          break;
        case "80_percent":
          notificationMessage = `${batch.contractorName} has completed 80% of ${batch.contractTitle}`;
          break;
        case "completed":
          batch.completedAt = new Date();
          notificationMessage = `${batch.contractorName} has completed ${batch.contractTitle}`;
          break;
      }

      if (notificationMessage) {
        // Notify admin
        await pusher.trigger("admin-channel", "work-status-update", {
          message: notificationMessage,
          batchId: batch._id,
          contractorName: batch.contractorName,
          batchTitle: batch.contractTitle,
          workStatus: workStatus,
          timestamp: new Date().toISOString(),
        });

        // Notify agency
        await pusher.trigger(`agency-channel`, `work-status-update-${batch.agencyId}`, {
          id: `work-${Date.now()}`,
          message: notificationMessage,
          batchId: batch._id,
          contractorName: batch.contractorName,
          batchTitle: batch.contractTitle,
          workStatus: workStatus,
          timestamp: new Date().toISOString(),
          type: "work-status-update",
        });
      }
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
    const { id } = req.params;
    const { milestoneIndex } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Validate milestone index
    if (milestoneIndex === undefined || !batch.milestones[milestoneIndex]) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone index",
      });
    }

    const milestone = batch.milestones[milestoneIndex];

    if (milestone.workStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot approve work that is not completed",
      });
    }

    // Update work approval for specific milestone
    milestone.workApproved = true;
    milestone.completedAt = new Date();
    await batch.save();

    // Trigger notification to contractor
    await pusher.trigger(
      "contractor-channel",
      `work-approved-${milestone.contractorId}`,
      {
        id: `app-${Date.now()}`,
        message: `Your work for milestone "${milestone.heading}" in ${batch.contractTitle} has been approved.`,
        timestamp: new Date().toISOString(),
        type: "work-approval",
        batchId: batch._id,
        milestoneIndex: milestoneIndex,
        milestoneHeading: milestone.heading
      }
    );

    // Notify admin
    await pusher.trigger("admin-channel", "work-approved", {
      id: `app-${Date.now()}`,
      message: `Work for milestone "${milestone.heading}" in ${batch.contractTitle} has been approved.`,
      timestamp: new Date().toISOString(),
      type: "work-approval",
      batchId: batch._id,
      contractorName: milestone.contractorName,
      milestoneIndex: milestoneIndex,
      milestoneHeading: milestone.heading
    });

    // Notify agency
    await pusher.trigger(`agency-channel`, `work-approved-${batch.agencyId}`, {
      id: `app-${Date.now()}`,
      message: `Work for milestone "${milestone.heading}" in ${batch.contractTitle} has been approved.`,
      timestamp: new Date().toISOString(),
      type: "work-approval",
      batchId: batch._id,
      contractorName: milestone.contractorName,
      milestoneIndex: milestoneIndex,
      milestoneHeading: milestone.heading
    });

    res.status(200).json({
      success: true,
      message: "Work approved successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error in approveWork:", error);
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
    const { transactionId, transactionDate, transactionType, milestoneIndex } = req.body;

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

      // Send notification to admin
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
      // Validate milestone index
      if (milestoneIndex === undefined || !batch.milestones[milestoneIndex]) {
        return res.status(400).json({
          success: false,
          message: "Invalid milestone index",
        });
      }

      const milestone = batch.milestones[milestoneIndex];

      // Check if the milestone's work is completed and approved
      if (milestone.workStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot make payment for incomplete work",
        });
      }
console.log(milestone.workApproved,"bbbbbbbb");  
      if (!milestone.workApproved) {
        return res.status(400).json({
          success: false,
          message: "Cannot make payment for unapproved work",
        });
      }

      // Check if payment is already made for this milestone
      if (milestone.nhaiToContractorPaymentStatus === "completed") {
        return res.status(400).json({
          success: false,
          message: "Payment already made for this milestone",
        });
      }

      // Update payment info for specific milestone
      milestone.nhaiToContractorTransactionId = transactionId;
      milestone.nhaiToContractorTransactionDate = transactionDate;
      if (req.file) {
        milestone.nhaiToContractorPaymentMedia = `/payment-media/${req.file.filename}`;
      }
      milestone.nhaiToContractorPaymentStatus = "completed";

      // Send notification to contractor
      await pusher.trigger(
        "contractor-channel",
        `payment-completed-${milestone.contractorId}`,
        {
          id: `pay-${Date.now()}`,
          message: `Payment completed for your milestone "${milestone.heading}" in ${batch.contractTitle}`,
          timestamp: new Date().toISOString(),
          type: "payment",
          batchId: batch._id,
          milestoneIndex: milestoneIndex,
          milestoneHeading: milestone.heading,
          amount: milestone.amount
        }
      );

      // Send notification to admin
      await pusher.trigger("admin-channel", "contractor-payment-sent", {
        id: `contractor-payment-${Date.now()}`,
        message: `Payment sent to ${milestone.contractorName} for milestone "${milestone.heading}" in ${batch.contractTitle}`,
        timestamp: new Date().toISOString(),
        type: "contractor-payment",
        batchId: batch._id,
        contractorName: milestone.contractorName,
        contractTitle: batch.contractTitle,
        milestoneHeading: milestone.heading,
        amount: milestone.amount
      });
    }

    await batch.save();

    // Send notification to admin
    await pusher.trigger("admin-channel", `batch-approved-${batch.adminId}`, {
      id: `batch-approved-${Date.now()}`,
      message: `Payment completed for ${batch.contractTitle}`,
      timestamp: new Date().toISOString(),
      type: "payment",
      batchId: batch._id,
    });

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

const updateMilestoneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { milestoneIndex, workStatus, workDetails } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Validate milestone index
    if (!batch.milestones[milestoneIndex]) {
      return res.status(400).json({
        success: false,
        message: "Invalid milestone index",
      });
    }

    // Update milestone status
    batch.milestones[milestoneIndex].workStatus = workStatus;
    batch.milestones[milestoneIndex].workDetails = workDetails;

    await batch.save();

    // Send notification to admin
    await pusher.trigger("admin-channel", "milestone-status-update", {
      message: `Milestone status updated for ${batch.contractTitle}`,
      batchId: batch._id,
      contractorName: batch.contractorName,
      batchTitle: batch.contractTitle,
      milestoneIndex: milestoneIndex,
      workStatus: workStatus,
      timestamp: new Date().toISOString(),
    });

    // Send notification to agency
    await pusher.trigger(`agency-channel`, `milestone-status-update-${batch.agencyId}`, {
      id: `milestone-${Date.now()}`,
      message: `Milestone status updated for ${batch.contractTitle}`,
      batchId: batch._id,
      contractorName: batch.contractorName,
      batchTitle: batch.contractTitle,
      milestoneIndex: milestoneIndex,
      workStatus: workStatus,
      timestamp: new Date().toISOString(),
      type: "milestone-status-update",
    });

    res.status(200).json({
      success: true,
      message: "Milestone status updated successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Error in updateMilestoneStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error updating milestone status",
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
  updateMilestoneStatus,
};
