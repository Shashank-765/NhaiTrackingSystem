import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import UserForm from "../Form/UserForm";
import BatchForm from "../Form/BatchForm";
import { toast } from "react-toastify";
import Dialog from "../Dialog/Dialog";
import approval from "../../Images/approval.jpg";
import approved from "../../Images/approved.png";
import invoice from "../../Images/invoice.png";
import Invoice from "../Invoice/Invoice";
import PayInfoForm from "../PayInfoForm/PayInfoForm";
import infoBatchAdmin from "../../Images/info-icon.png";
import Tracker from "../Tracker/Tracker";
import InfoModal from "../InfoModal/InfoModal";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [showUserForm, setShowUserForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchLoading, setIsBatchLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payInfoForm, setPayInfoForm] = useState({
    isOpen: false,
    batchId: null,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    batchId: null,
    currentStatus: "",
    newStatus: "",
  });

  const [approvalDialog, setApprovalDialog] = useState({
    isOpen: false,
    batchId: null,
  });

  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const navigate = useNavigate();
  const handleCreateUser = () => {
    setShowUserForm(true);
  };

  const handleCloseUserForm = () => {
    setShowUserForm(false);
    fetchUsers();
  };

  const handleCreateBatch = () => {
    setShowBatchForm(true);
  };

  const handleCloseBatchForm = () => {
    setShowBatchForm(false);
    fetchBatches();
  };
const handlePayInfoForm = (batchId) => {
  const batch = batches.find((batch) => batch._id === batchId);

  if (batch.nhaiToContractorPaymentStatus.toLowerCase() === 'completed') {
    toast.warning('Payment is already done', {
      autoClose: 1000,
    });
    return;
  }

  // Calculate payment amount based on work status
  let paymentPercentage = 0;
  let paymentAmount = 0;

  switch (batch.workStatus) {
    case 'pending': // Treat as 30%
    case '30_percent':
      paymentPercentage = 30;
      paymentAmount = (batch.contractorValue * 30) / 100;
      break;

    case '80_percent':
      paymentPercentage = 80;
      paymentAmount = (batch.contractorValue * 80) / 100;
      break;

  case '100_percent':
  case 'completed': // Treat completed as 100%
    paymentPercentage = 100;
    paymentAmount = batch.contractorValue;
    break;

    default:
      toast.warning('Work status must be at least 30% complete for payment', {
        autoClose: 2000,
      });
      return;
  }

  // Only allow payment if work is approved
  if (!batch.workApproved) {
    toast.warning('Work must be approved before payment can be made', {
      autoClose: 2000,
    });
    return;
  }

  setPayInfoForm({
    isOpen: !payInfoForm.isOpen,
    batchId,
    paymentAmount,
    paymentPercentage,
  });
};

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error("Error fetching users");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setIsBatchLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/batches`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setBatches(data.data);
      } else {
        toast.error("Error fetching batches");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsBatchLoading(false);
    }
  };
  const initiateStatusUpdate = (batchId, currentStatus) => {
    // Only allow status update if current status is pending
    if (currentStatus.toLowerCase() !== "pending") {
      toast.warning("Only pending batches can be updated");
      return;
    }

    const newStatus = "approved";

    setConfirmDialog({
      isOpen: true,
      batchId,
      currentStatus,
      newStatus,
    });
  };

  const handleStatusUpdate = async () => {
    const { batchId, newStatus } = confirmDialog;

    // Optimistic update
    const batchIndex = batches.findIndex((batch) => batch._id === batchId);
    if (batchIndex === -1) return;

    const updatedBatches = [...batches];
    const originalStatus = updatedBatches[batchIndex].status;
    updatedBatches[batchIndex].status = newStatus;
    setBatches(updatedBatches);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Batch status updated to ${newStatus}`);
      } else {
        // Revert optimistic update on failure
        updatedBatches[batchIndex].status = originalStatus;
        setBatches(updatedBatches);
        toast.error(data.message || "Error updating batch status");
      }
    } catch (error) {
      // Revert optimistic update on error
      updatedBatches[batchIndex].status = originalStatus;
      setBatches(updatedBatches);
      toast.error("Server error. Please try again later.");
    }

    setConfirmDialog({
      isOpen: false,
      batchId: null,
      currentStatus: "",
      newStatus: "",
    });
  };
  const handleWorkApproval = async (batchId) => {
    const batch = batches.find((b) => b._id === batchId);
    if (
      batch &&
      batch.workStatus.toLowerCase() === "completed" &&
      !batch.workApproved
    ) {
      setApprovalDialog({
        isOpen: true,
        batchId,
      });
    }
  };

  const handleApprovalConfirm = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/batches/${approvalDialog.batchId}/approve-work`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setBatches(
          batches.map((batch) =>
            batch._id === approvalDialog.batchId
              ? { ...batch, workApproved: true }
              : batch
          )
        );
        toast.success("Work approved successfully");
      } else {
        toast.error(data.message || "Error approving work");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    }
    setApprovalDialog({ isOpen: false, batchId: null });
  };
  const refreshBatchInfo = () => {
    setRefreshTrigger((prev) => !prev);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBatches = batches.filter(
    (batch) =>
      batch.contractTitle
        ?.toLowerCase()
        .includes(batchSearchTerm.toLowerCase()) ||
      batch.contractId?.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
      batch.agencyName?.toLowerCase().includes(batchSearchTerm.toLowerCase()) ||
      batch.contractorName
        ?.toLowerCase()
        .includes(batchSearchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
    fetchBatches();
  }, [refreshTrigger]);

  // Function to handle invoice click ----- commented out for now
  const handleInvoiceClick = (batch) => {
    if (batch.workApproved && batch.workStatus === "completed" && batch.agencyToNhaiPaymentStatus.toLowerCase() === 'completed') {
      setSelectedInvoice(batch);
    } else {
      toast.warning(
        "Invoice is only available after work is completed and approved and payment is done by agency."
      );
    }
  };

  // On admin dashboard, handle download
  const handleAdminInvoiceDownload = async (batchId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/invoice/${batchId}/download-invoice`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.warning(result.message || "Download blocked");
        return;
      }

      // Proceed to handle download (e.g., open PDF, save blob, etc.)
      // const fileBlob = await response.blob();
      // saveAs(fileBlob, "Invoice.pdf");

      toast.success("Invoice downloaded!");
    } catch (error) {
      toast.error("Server error during invoice download.");
    }
  };

  const handleInfoClick = (batchId) => {
    navigate(`/tracker/${batchId}`);
  };

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>

      <div className="batch-section">
        <div className="batch-section-heading">
          <h2>Batches Overview</h2>
          <div className="search-create">
            <input
              type="text"
              placeholder="Search in Batches"
              className="batch-searchbox"
              value={batchSearchTerm}
              onChange={(e) => setBatchSearchTerm(e.target.value)}
            />
            <button className="primary-btn" onClick={handleCreateBatch}>
              Create Batch
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="batch-table" cellSpacing={0}>
            <thead>
              <tr>
                <th>ContractId</th>
                <th>Title</th>
                <th>Agency Name</th>
                <th>Contractor Name</th>
                <th>Admin</th>
                <th>Bid Amount</th>
                <th>Contractor Amount</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Invoice</th>
                <th>Pay to Contractor</th>
                <th>Info</th>
              </tr>
            </thead>
            <tbody>
              {isBatchLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No batches to show
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch._id} className="batch-table-row">
                    <td>{batch.contractId}</td>
                    <td>{batch.contractTitle}</td>
                    <td>{batch.agencyName}</td>
                    <td>{batch.contractorName}</td>
                    <td>{batch.adminName || "Admin"}</td>
                    <td>₹{batch.bidValue}</td>
                    <td>₹{batch.contractorValue || "N/A"}</td>
                    <td>{batch.bidDuration}</td>
                    <td>
                      {/* <button
                        className={`status-btn ${batch.status.toLowerCase()}`}
                        onClick={() =>
                          initiateStatusUpdate(batch._id, batch.status)
                        }
                        disabled={batch.status.toLowerCase() !== "pending"}
                      >
                        {batch.status === "pending" ? "Pending" : "Approved"}
                      </button> */}
                      <button
                        type="button"
                        className="edit-btn"
                        style={{
                          opacity: batch.status === "approved" ? 0.7 : 0.7,
                          cursor:
                            batch.status === "approved"
                              ? "not-allowed"
                              : "not-allowed",
                        }}
                      >
                        {batch.status === "pending" ? "Pending" : "Approved"}
                      </button>
                    </td>
                    <td className="approval-status-icon">
                      <img
                        // src={batch.workApproved ? approved : approval}
                        src={approval}
                        alt="approval"
                        className="approval-icon"
                        style={{
                          opacity:
                            batch.workStatus.toLowerCase() === "completed"
                              ? // && batch.workApproved
                                1
                              : 0.6,
                          cursor:
                            batch.workStatus.toLowerCase() === "completed"
                              ? // && batch.workApproved
                                "pointer"
                              : "not-allowed",
                        }}
                        onClick={() =>
                          batch.workStatus.toLowerCase() === "completed" &&
                          // !batch.workApproved &&
                          handleWorkApproval(batch._id)
                        }
                      />
                    </td>
                    <td>
                      <img
                        src={invoice}
                        alt="invoice"
                        className="invoice-icon"
                        style={{
                          opacity: batch.agencyToNhaiPaymentStatus.toLowerCase() === 'completed' ? 1 : 0.7,
                          cursor: batch.agencyToNhaiPaymentStatus.toLowerCase() === 'completed'
                            ? "pointer"
                            : "not-allowed",
                        }}
                        onClick={() =>
                          // batch.invoiceDownloaded && handleInvoiceClick(batch)
                          handleInvoiceClick(batch)
                        }
                        // onClick={() => handleAdminInvoiceDownload(batch)}
                        // onClick={() => batch.invoiceDownloaded && handleAdminInvoiceDownload(batch._id)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="payinfo-button"
                        disabled={
                          batch.agencyToNhaiPaymentStatus.toLowerCase() === 'pending'
                        }
                        onClick={() => handlePayInfoForm(batch._id)}
                      >
                        Pay to Contractor
                      </button>
                    </td>
                    <td>
                      <img
                        src={infoBatchAdmin}
                        alt=""
                        className="info-icon"
                        onClick={() => handleInfoClick(batch._id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pay info form */}
      {payInfoForm.isOpen && (
        <PayInfoForm
          batchId={payInfoForm.batchId}
          paymentAmount={payInfoForm.paymentAmount}
          paymentPercentage={payInfoForm.paymentPercentage}
          onClose={() => setPayInfoForm({ isOpen: false, batchId: null })}
          onSuccess={refreshBatchInfo}
        />
      )}
      {/* batch form */}
      {showBatchForm && (
        <BatchForm handleCloseBatchForm={handleCloseBatchForm} />
      )}

      {/* user section */}
      <div className="user-section">
        <div className="user-section-heading">
          <h2>Users</h2>
          <div className="search-create">
            <input
              type="text"
              placeholder="Search"
              className="user-searchbox"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="primary-btn" onClick={handleCreateUser}>
              Create User
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="user-table" cellSpacing={0}>
            <thead>
              <tr>
                <th>UserId</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uniqueId} className="user-table-row">
                    <td>{user.uniqueId}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* status change from pending to update */}
      {showUserForm && <UserForm handleCloseUserForm={handleCloseUserForm} />}

      {confirmDialog.isOpen && (
        <Dialog
          message={`Are you sure you want to change the status to ${confirmDialog.newStatus}?`}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={handleStatusUpdate}
        />
      )}

      {/* status change of work approval */}
      {approvalDialog.isOpen && (
        <Dialog
          message="Are you sure you want to approve this work? This action cannot be undone."
          onClose={() => setApprovalDialog({ isOpen: false, batchId: null })}
          onConfirm={handleApprovalConfirm}
        />
      )}

      {/* showing of invoice */}
      {selectedInvoice && (
        <div
          className="invoice-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedInvoice(null)}
              style={{
                position: "absolute",
                right: "10px",
                top: "10px",
                padding: "5px 10px",
                backgroundColor: "#ff4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <Invoice batch={selectedInvoice} />
          </div>
        </div>
      )}

      {/* Info Modal for Batch Details */}
      {selectedBatchInfo && (
        <Tracker
          batch={selectedBatchInfo}
          onClose={() => setSelectedBatchInfo(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
