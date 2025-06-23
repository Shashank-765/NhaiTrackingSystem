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
    completedAt: {
      type: Date,
    },

    milestones: [
      {
        heading: {
          type: String,
          required: [true, "Milestone heading is required"],
        },
        bidAmount: {
          type: Number,
        },
        bidDuration: {
          type: String,
          required: false,
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
            validator: function (v) {
              return v instanceof Date && !isNaN(v);
            },
            message: "Start date must be a valid date"
          }
        },
        endDate: {
          type: Date,
          required: [true, "End date is required"],
          validate: {
            validator: function (v) {
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
        workApproved: {
          type: Boolean,
          default: false,
          required: true
        },
        completedAt: {
          type: Date
        },
        invoiceDownloads: {
          admin: {
            downloaded: {
              type: Boolean,
              default: false
            },
            date: {
              type: Date,
              default: null
            }
          },
          contractor: {
            downloaded: {
              type: Boolean,
              default: false
            },
            date: {
              type: Date,
              default: null
            }
          }
        },
        nhaiToContractor: [
          {
            nhaiToContractorTransactionId: {
              type: String,
              required: [true, "Transaction ID is required"]
            },
            nhaiToContractorTransactionDate: {
              type: Date,
              required: [true, "Transaction date is required"],
              default: Date.now
            },
            nhaiToContractorPaymentMedia: {
              type: String,
              required: [true, "Payment media is required"]
            },
            nhaiToContractorPaymentStatus: {
              type: String,
              enum: ["pending", "completed"],
              default: "pending"
            },
            createdAt: {
              type: Date,
              default: Date.now
            }
          }
        ],
        agencytoNhai: [
          {
            agencytoNhaiTransactionId: {
              type: String,
              required: [true, "Transaction ID is required"]
            },
            agencytoNhaiTransactionDate: {
              type: Date,
              required: [true, "Transaction date is required"],
              default: Date.now
            },
            agencytoNhaiPaymentMedia: {
              type: String,
              required: [true, "Payment media is required"]
            },
            agencytoNhaiAmount: {
              type: Number,
              min: [0, "Amount cannot be negative"]
            },
            agencytoNhaiPaymentStatus: {
              type: String,
              enum: ["pending", "completed"],
              default: "pending"
            },
            createdAt: {
              type: Date,
              default: Date.now
            }
          }
        ]
      },
    ],
  },
  {
    timestamps: true,
  }
);

batchSchema.pre('save', function (next) {
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