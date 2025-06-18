const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    contractTitle: {
      type: String,
      required: [true, "Contract title is required"],
    },
    contractId: {
      type: String,
      required: [true, "Contract ID is required"],
      unique: true,
    },
    bidValue: {
      type: Number,
      required: [true, "Bid value is required"],
    },
    contractorValue: {
      type: Number,
      required: false,
    },
    bidDuration: {
      type: String,
      required: false,
    },
    agencyName: {
      type: String,
      required: [true, "Agency name is required"],
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Agency ID is required"],
    },
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    workDetails: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    invoiceDownloaded: {
      type: Boolean,
      default: false,
    },
    agencyToNhaiTransactionId: {
      type: String,
      default: "",
    },
    agencyToNhaiTransactionDate: {
      type: Date,
    },
    agencyToNhaiPaymentMedia: {
      type: String,
      default: "",
    },
    agencyToNhaiPaymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    nhaiToContractorTransactionId: {
      type: String,
      default: "",
    },
    nhaiToContractorTransactionDate: {
      type: Date,
    },
    nhaiToContractorPaymentMedia: {
      type: String,
      default: "",
    },
    nhaiToContractorPaymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    milestones: [
      {
        heading: {
          type: String,
          required: [true, "Milestone heading is required"],
        },
        contractorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Contractor ID is required for milestone"],
        },
        contractorName: {
          type: String,
          required: [true, "Contractor name is required for milestone"],
        },
        amount: {
          type: Number,
          required: [true, "Milestone amount is required"],
        },
        startDate: {
          type: Date,
          required: [true, "Start date is required"],
          validate: {
            validator: function(v) {
              return v instanceof Date && !isNaN(v);
            },
            message: "Start date must be a valid date"
          }
        },
        endDate: {
          type: Date,
          required: [true, "End date is required"],
          validate: {
            validator: function(v) {
              return v instanceof Date && !isNaN(v);
            },
            message: "End date must be a valid date"
          }
        },
        status: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending",
        },
        workStatus: {
          type: String,
          enum: ["pending", "30_percent", "80_percent", "completed"],
          default: "pending"
        },
        workDetails: {
          type: String,
          default: ""
        },
        workApproved: {
          type: Boolean,
          default: false,
          required: true
        },
        completedAt: {
          type: Date
        },
        nhaiToContractorPaymentStatus: {
          type: String,
          enum: ["pending", "completed"],
          default: "pending"
        },
        nhaiToContractorTransactionId: {
          type: String,
          default: ""
        },
        nhaiToContractorTransactionDate: {
          type: Date
        },
        nhaiToContractorPaymentMedia: {
          type: String,
          default: ""
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add a pre-save middleware to validate milestone dates
batchSchema.pre('save', function(next) {
  if (this.milestones && this.milestones.length > 0) {
    for (let i = 0; i < this.milestones.length; i++) {
      const milestone = this.milestones[i];
      if (milestone.startDate && milestone.endDate) {
        if (milestone.endDate < milestone.startDate) {  
          next(new Error(`Milestone ${i + 1}: End date must be after start date`));
          return;
        }
      }
    }
  }
  next();
});

module.exports = mongoose.model("Batch", batchSchema);
