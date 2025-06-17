const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    contractTitle: {
      type: String,
      required: [true, "Contract title is required"],
      trim: true,
    },
    contractId: {
      type: String,
      required: [true, "Contract ID is required"],
      unique: true,
      trim: true,
    },
    bidValue: {
      type: Number,
      required: [true, "Bid value is required"],
    },
    contractorValue: {
      type: Number,
      required: [true, "Contractor value is required"],
    },
    bidDuration: {
      type: String,
      required: [true, "Bid duration is required"],
      trim: true,
    },
    agencyName: {
      type: String,
      required: [true, "Agency name is required"],
      trim: true,
    },
    agencyId: {
      type: String,
      required: [true, "Agency ID is required"],
      trim: true,
    },
    contractorName: {
      type: String,
      required: [true, "Contractor name is required"],
      trim: true,
    },
    contractorId: {
      type: String,
      required: [true, "Contractor ID is required"],
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    workStatus: {
      type: String,
      enum: ["pending", "30_percent", "80_percent", "completed"],
      default: "pending",
    },
    workApproved: {
      type: Boolean,
      default: false,
    },
    workDetails: {
      type: String,
      default: "",
    },
    invoiceDownloaded: {
      type: Boolean,
      default: false,
    },
    adminInvoiceDownloaded: {
      type: Boolean,
      default: false,
    },
    contractorInvoiceDownloaded: {
      type: Boolean,
      default: false,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    transactionDate: {
      type: Date,
    },
    transactionTime: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    paymentMedia: {
      type: String,
    },
    // fields for agency to nhai payment
    agencyToNhaiTransactionId: {
      type: String,
      trim: true,
    },
    agencyToNhaiTransactionDate: {
      type: Date,
    },
    agencyToNhaiTransactionTime: {
      type: Date,
      default: null,
    },
    agencyToNhaiPaymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    agencyToNhaiPaymentMedia: {
      type: String,
    },
    // fields for nhai to contractor payment
    nhaiToContractorTransactionId: {
      type: String,
      trim: true,
    },
    nhaiToContractorTransactionDate: {
      type: Date,
    },
    nhaiToContractorTransactionTime: {
      type: Date,
      default: null,
    },
    nhaiToContractorPaymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    nhaiToContractorPaymentMedia: {
      type: String,
    },
    // Add milestone fields
    milestones: [{
      heading: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
      }
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Batch", batchSchema);
