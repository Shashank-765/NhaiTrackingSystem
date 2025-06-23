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

    console.log('Sending contractor notification to:', `batch-created-${newBatch.contractorId}`);
    console.log('ContractorId:', newBatch.contractorId, 'Type:', typeof newBatch.contractorId);
    await pusher.trigger(
      "contractor-channel",
      `batch-created-${newBatch.contractorId}`,
      {
        id: `batch-created-${Date.now()}`,
        message: `Contract of ${newBatch.contractTitle} has been created for you!`,
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
    const contractorName = batch.milestones[0]?.contractorName || "Unknown Contractor";
    await pusher.trigger("admin-channel", `batch-approved-${batch.adminId}`, {
      id: `batch-approved-${Date.now()}`,
      message: `Contract for ${batch.contractTitle} has been given to ${contractorName}!`,
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
    console.log(batch,"batchnotification");
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
        const contractorName = batch.milestones[0]?.contractorName || "Unknown Contractor";
        console.log("Sending admin work-status-update notification for batch:", batch._id, "workStatus:", workStatus);
        await pusher.trigger("admin-channel", "work-status-update", {
          message: notificationMessage,
          batchId: batch._id,
          contractorName: contractorName,
          batchTitle: batch.contractTitle,
          workStatus: workStatus,
          timestamp: new Date().toISOString(),
        });

        // Notify agency
        await pusher.trigger(`agency-channel`, `work-status-update-${batch.agencyId}`, {
          id: `work-${Date.now()}`,
          message: notificationMessage,
          batchId: batch._id,
          contractorName: contractorName,
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

    const targetMilestone = batch.milestones[milestoneIndex];

    if (targetMilestone.workStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot approve work that is not completed",
      });
    }

    // Get the milestone details to find all similar milestones
    const contractorId = targetMilestone.contractorId;
    const milestoneHeading = targetMilestone.heading;

    // Approve ALL milestones with the same contractorId and heading
    let approvedCount = 0;
    batch.milestones.forEach((milestone, index) => {
      if (milestone.contractorId.toString() === contractorId.toString() && 
          milestone.heading === milestoneHeading &&
          milestone.workStatus === "completed") {
        milestone.workApproved = true;
        milestone.completedAt = new Date();
        approvedCount++;
        console.log(`Approved milestone at index ${index} for contractor ${milestone.contractorName}`);
      }
    });

    console.log(`Approved ${approvedCount} milestones for contractor ${targetMilestone.contractorName} and heading ${milestoneHeading}`);

    await batch.save();

    // Trigger notification to contractor
    await pusher.trigger(
      "contractor-channel",
      `work-approved-${targetMilestone.contractorId}`,
      {
        id: `app-${Date.now()}`,
        message: `Your work for milestone "${milestoneHeading}" in ${batch.contractTitle} has been approved.`,
        timestamp: new Date().toISOString(),
        type: "work-approval",
        batchId: batch._id,
        milestoneIndex: milestoneIndex,
        milestoneHeading: milestoneHeading,
        approvedCount: approvedCount
      }
    );

    // Notify admin
    const contractorName = targetMilestone?.contractorName || "Unknown Contractor";
    await pusher.trigger("admin-channel", "work-approved", {
      id: `app-${Date.now()}`,
      message: `Work for milestone "${milestoneHeading}" in ${batch.contractTitle} has been approved.`,
      timestamp: new Date().toISOString(),
      type: "work-approval",
      batchId: batch._id,
      contractorName: contractorName,
      milestoneIndex: milestoneIndex,
      milestoneHeading: milestoneHeading,
      approvedCount: approvedCount
    });

    // Notify agency
    await pusher.trigger(`agency-channel`, `work-approved-${batch.agencyId}`, {
      id: `app-${Date.now()}`,
      message: `Work for milestone "${milestoneHeading}" in ${batch.contractTitle} has been approved.`,
      timestamp: new Date().toISOString(),
      type: "work-approval",
      batchId: batch._id,
      contractorName: contractorName,
      milestoneIndex: milestoneIndex,
      milestoneHeading: milestoneHeading,
      approvedCount: approvedCount
    });

    res.status(200).json({
      success: true,
      message: `Work approved successfully for ${approvedCount} milestone(s)`,
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

// download invoice - handles all invoice operations
const downloadInvoice = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    const { role } = req.user || {};
    const { milestoneIndex } = req.body;

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    if (!batch.milestones[milestoneIndex]) {
      return res.status(400).json({ success: false, message: "Invalid milestone index" });
    }

    const milestone = batch.milestones[milestoneIndex];
    const now = new Date();

    // Check for required fields before updating
    if (milestone.bidAmount == null) {
      return res.status(400).json({ success: false, message: "Milestone is missing required bidAmount" });
    }

    if (role === "admin") {
      milestone.invoiceDownloads.admin.downloaded = true;
      milestone.invoiceDownloads.admin.date = now;
    } else if (role === "Contractor") {
      // Contractor can only download if admin has already downloaded
      if (!milestone.invoiceDownloads.admin.downloaded) {
        return res.status(403).json({
          success: false,
          message: "Admin must download the invoice before contractor can access it."
        });
      }
      milestone.invoiceDownloads.contractor.downloaded = true;
      milestone.invoiceDownloads.contractor.date = now;
    } else {
      return res.status(403).json({ success: false, message: "Unauthorized role" });
    }

    await batch.save();

    // Send notification
    const timestamp = new Date();
    const contractorName = batch.milestones[0]?.contractorName || "Unknown Contractor";
    await pusher.trigger('admin-channel', 'invoice-downloaded', {
      id: `inv-${Date.now()}`,
      message: `${contractorName} has downloaded invoice for ${batch.contractTitle}`,
      batchId: batch._id,
      contractorName: contractorName,
      contractTitle: batch.contractTitle,
      timestamp: timestamp.toISOString(),
      // downloadedBy: isAdmin ? 'admin' : 'contractor'
    });
    try {
      await batch.save();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Error saving invoice download status",
        error: err.message
      });
    }

    return res.status(200).json({
      success: true,
      message: `Invoice downloaded successfully by ${role}.`,
      data: {
        contractTitle: batch.contractTitle,
        milestoneHeading: milestone.heading,
        downloadedBy: role,
        date: now
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updatePaymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      transactionId, 
      transactionDate, 
      transactionType, 
      milestoneIndex = 0,
      amount 
    } = req.body;
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

    const milestone = batch.milestones[milestoneIndex];
    if (transactionType === 'agency_to_nhai') {
      // Validate required fields for agency payment
      if (!transactionId || !transactionDate) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID and Transaction Date are required for agency payment"
        });
      }

      // Add payment to agencytoNhai array for specific milestone
      const newAgencyPayment = {
        agencytoNhaiTransactionId: transactionId,
        agencytoNhaiTransactionDate: new Date(transactionDate),
        agencytoNhaiPaymentMedia: req.file ? `/payment-media/${req.file.filename}` : "",
        agencytoNhaiAmount: amount || milestone.bidAmount || 0, 
        agencytoNhaiPaymentStatus: "completed"
      };
      milestone.agencytoNhai.push(newAgencyPayment);
      await pusher.trigger("admin-channel", "agency-payment-received", {
        id: `agency-payment-${Date.now()}`,
        message: `Payment received from ${batch.agencyName} for contract: ${batch.contractTitle}`,
        timestamp: new Date().toISOString(),
        type: "agency-payment",
        batchId: batch._id,
        agencyName: batch.agencyName,
        contractTitle: batch.contractTitle,
        amount: amount
      });

    } else if (transactionType === 'nhai_to_contractor') {
      if (!transactionId || !transactionDate) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID, Transaction Date, and Amount are required for NHAI payment"
        });
      }
      if (milestone.workStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot make payment for incomplete work",
        });
      }

      if (!milestone.workApproved) {
        return res.status(400).json({
          success: false,
          message: "Cannot make payment for unapproved work",
        });
      }

      // Check if agency payment is completed first
      const lastAgencyPayment = milestone.agencytoNhai.at(-1);
      if (!lastAgencyPayment || lastAgencyPayment.agencytoNhaiPaymentStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Agency payment must be completed before NHAI can pay contractor",
        });
      }

      // Add payment to nhaiToContractor array for specific milestone
      const newNhaiPayment = {
        nhaiToContractorTransactionId: transactionId,
        nhaiToContractorTransactionDate: new Date(transactionDate),
        nhaiToContractorPaymentMedia: req.file ? `/payment-media/${req.file.filename}` : "",
        nhaiToContractorPaymentStatus: "completed"
      };
      milestone.nhaiToContractor.push(newNhaiPayment);
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
          amount: amount 
        }
      );
      await pusher.trigger("admin-channel", "contractor-payment-sent", {
        id: `contractor-payment-${Date.now()}`,
        message: `Payment sent to ${milestone.contractorName} for milestone "${milestone.heading}" in ${batch.contractTitle}`,
        timestamp: new Date().toISOString(),
        type: "contractor-payment",
        batchId: batch._id,
        contractorName: milestone.contractorName,
        contractTitle: batch.contractTitle,
        milestoneHeading: milestone.heading,
        amount: amount 
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type. Must be 'agency_to_nhai' or 'nhai_to_contractor'"
      });
    }

    console.log("Saving batch...");
    await batch.save();
    console.log("Batch saved successfully");

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
      error: error.message
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

    const targetMilestone = batch.milestones[milestoneIndex];
    const contractorId = targetMilestone.contractorId;
    const milestoneHeading = targetMilestone.heading;

    let updatedCount = 0;
    batch.milestones.forEach((milestone, index) => {
      if (milestone.contractorId.toString() === contractorId.toString() && 
          milestone.heading === milestoneHeading) {
        milestone.workStatus = workStatus;
        milestone.workDetails = workDetails;
        updatedCount++;
        console.log(`Updated milestone at index ${index} for contractor ${milestone.contractorName}`);
      }
    });

    console.log(`Updated ${updatedCount} milestones for contractor ${targetMilestone.contractorName} and heading ${milestoneHeading}`);

    await batch.save();


    const contractorName = targetMilestone?.contractorName || "Unknown Contractor";
    await pusher.trigger("admin-channel", "milestone-status-update", {
      message: `${contractorName} has "${milestoneHeading}" milestone  ${workStatus} (${batch.contractTitle})`,
      batchId: batch._id,
      contractorName: contractorName,
      batchTitle: batch.contractTitle,
      milestoneIndex: milestoneIndex,
      milestoneHeading: milestoneHeading,
      workStatus: workStatus,
      updatedCount: updatedCount,
      timestamp: new Date().toISOString(),
    });


    await pusher.trigger(`agency-channel`, `milestone-status-update-${batch.agencyId}`, {
      id: `milestone-${Date.now()}`,
      message: `Milestone status updated for ${batch.contractTitle}`,
      contractorName: contractorName,
      batchTitle: batch.contractTitle,
      milestoneIndex: milestoneIndex,
      workStatus: workStatus,
      updatedCount: updatedCount,
      timestamp: new Date().toISOString(),
      type: "milestone-status-update",
    });

    res.status(200).json({
      success: true,
      message: `Milestone status updated successfully for ${updatedCount} milestone(s)`,
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

const trackInvoiceDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    const downloadRecord = {
      userId: userId,
      userRole: userRole,
      downloadedAt: new Date(),
    };

    if (!batch.invoiceDownloads) {
      batch.invoiceDownloads = [];
    }
    batch.invoiceDownloads.push(downloadRecord);

    await batch.save();

    res.status(200).json({
      success: true,
      message: "Invoice download tracked successfully",
      data: downloadRecord,
    });
  } catch (error) {
    console.error("Error in trackInvoiceDownload:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking invoice download",
      error: error.message,
    });
  }
};

const notifyInvoiceDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole, userName } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Send notification to admin about invoice download
    await pusher.trigger("admin-channel", "invoice-downloaded", {
      id: `invoice-download-${Date.now()}`,
      message: `${userName || 'User'} (${userRole}) downloaded invoice for contract "${batch.contractTitle}"`,
      timestamp: new Date().toISOString(),
      type: "invoice-download",
      batchId: batch._id,
      contractTitle: batch.contractTitle,
      userId: userId,
      userRole: userRole,
      userName: userName
    });

    // Send notification to agency if user is not agency
    if (userRole !== 'agency') {
      await pusher.trigger(`agency-channel`, `invoice-downloaded-${batch.agencyId}`, {
        id: `invoice-download-${Date.now()}`,
        message: `Invoice downloaded for contract "${batch.contractTitle}" by ${userName || 'User'} (${userRole})`,
        timestamp: new Date().toISOString(),
        type: "invoice-download",
        batchId: batch._id,
        contractTitle: batch.contractTitle,
        userId: userId,
        userRole: userRole,
        userName: userName
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice download notification sent successfully",
    });
  } catch (error) {
    console.error("Error in notifyInvoiceDownload:", error);
    res.status(500).json({
      success: false,
      message: "Error sending invoice download notification",
      error: error.message,
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
  trackInvoiceDownload,
  notifyInvoiceDownload,
};
