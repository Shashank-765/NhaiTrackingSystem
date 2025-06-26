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
import logo from "../../Images/logo.png";
import Navbar from "../Navbar/Navbar";

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

 const [currentPage,setCurrentPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);

 const [itemsPerPage] = useState(10);

 //users
 const [userPage, setUserPage] = useState(1);
const [userTotalPages, setUserTotalPages] = useState(1);
  const [payInfoForm, setPayInfoForm] = useState({
    isOpen: false,
    batchId: null,
    selectedMilestoneIndex: null,
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
    milestoneIndex: null,
    contractorName: null,
  });

  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);

  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const navigate = useNavigate();

  const [selectedMilestoneIndices, setSelectedMilestoneIndices] = useState({});

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
    if (!batch) return;

    const selectedMilestoneIndex = selectedMilestoneIndices[batchId] || 0;
    const selectedMilestone = batch.milestones[selectedMilestoneIndex];
    if (!selectedMilestone) return;

    console.log('Payment status check:', {
      batchId,
      selectedMilestoneIndex,
      paymentStatus: selectedMilestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus,
      workStatus: selectedMilestone.workStatus,
      workApproved: selectedMilestone.workApproved
    });

    // Prevent duplicate payment - check the specific milestone's payment status
    if (selectedMilestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus?.toLowerCase() === 'completed') {
      toast.warning('Payment is already done for this milestone', {
        autoClose: 1000,
      });
      return;
    }

    // Check if work is completed and approved
    if (selectedMilestone.workStatus?.toLowerCase() !== 'completed') {
      toast.warning('Work must be completed before payment can be made', {
        autoClose: 2000,
      });
      return;
    }

    if (!selectedMilestone.workApproved) {
      toast.warning('Work must be approved before payment can be made', {
        autoClose: 2000,
      });
      return;
    }

    // Open payment form with milestone details
    setPayInfoForm({
      isOpen: !payInfoForm.isOpen,
      batchId,
      selectedMilestoneIndex,
      paymentAmount: selectedMilestone.amount,
      paymentPercentage: 100, // Since we only allow payment for completed work
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/users?page=${userPage}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUserTotalPages(data.pagination.totalPages);
        setUsers(data.data);
      } else {
        toast.error(data.message || "Error fetching users");
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setIsBatchLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/batches?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setBatches(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.message || "Error fetching batches");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBatchPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleUserPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= userTotalPages) {
      setUserPage(newPage);
    }
  };

  const initiateStatusUpdate = (batchId, currentStatus) => {
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
    if (updatedBatches[batchIndex].milestones) {
      updatedBatches[batchIndex].milestones = updatedBatches[batchIndex].milestones.map(milestone => ({
        ...milestone,
        status: newStatus
      }));
    }
    
    setBatches(updatedBatches);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ 
            status: newStatus,
            updateMilestones: true // Add this flag to update milestones on the backend
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Batch status updated to ${newStatus}`);
        fetchBatches();
      } else {
        updatedBatches[batchIndex].status = originalStatus;
        if (updatedBatches[batchIndex].milestones) {
          updatedBatches[batchIndex].milestones = updatedBatches[batchIndex].milestones.map(milestone => ({
            ...milestone,
            status: originalStatus
          }));
        }
        setBatches(updatedBatches);
        toast.error(data.message || "Error updating batch status");
      }
    } catch (error) {
      // Revert optimistic update on error
      updatedBatches[batchIndex].status = originalStatus;
      if (updatedBatches[batchIndex].milestones) {
        updatedBatches[batchIndex].milestones = updatedBatches[batchIndex].milestones.map(milestone => ({
          ...milestone,
          status: originalStatus
        }));
      }
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
  const handleWorkApproval = async (batchId, milestoneIndex) => {
    const batch = batches.find((b) => b._id === batchId);
    if (!batch || !batch.milestones || !batch.milestones[milestoneIndex]) return;

    const milestone = batch.milestones[milestoneIndex];
    if (milestone.workStatus.toLowerCase() === "completed" && !milestone.workApproved) {
      setApprovalDialog({
        isOpen: true,
        batchId,
        milestoneIndex,
        contractorName: milestone.contractorName
      });
    }
  };

  const handleApprovalConfirm = async () => {
    try {
      const { batchId, milestoneIndex } = approvalDialog;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}/approve-work`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            milestoneIndex
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBatches(
          batches.map((batch) =>
            batch._id === batchId
              ? {
                  ...batch,
                  milestones: batch.milestones.map((milestone, index) =>
                    index === milestoneIndex
                      ? { ...milestone, workApproved: true }
                      : milestone
                  ),
                }
              : batch
          )
        );
        toast.success(`Work approved for ${approvalDialog.contractorName}'s milestone`);
      } else {
        toast.error(data.message || "Error approving work");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    }
    setApprovalDialog({ isOpen: false, batchId: null, milestoneIndex: null, contractorName: null });
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
  }, [refreshTrigger, currentPage,userPage]);

  // Function to handle invoice click
  const handleInvoiceClick = (batch) => {
    const selectedMilestoneIndex = selectedMilestoneIndices[batch._id] || 0;
    const selectedMilestone = batch.milestones?.[selectedMilestoneIndex];
    if (
      selectedMilestone?.workApproved &&
      selectedMilestone?.workStatus === "completed" &&
      selectedMilestone?.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === 'completed'
    ) {
      setSelectedInvoice({ batch, selectedMilestone });
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
        `${API_URL}/invoice/${batchId}/download-invoice`,
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
    const batch = batches.find(b => b._id === batchId);
    if (batch) {
      navigate(`/tracker/${batchId}`, { state: { batch } });
    }
  };

  return (
    <div className="dashboard">
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
                <th>Bid Amount</th>
                <th>Bid Duration</th>
                <th>Contractor Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Pay to Contractor</th>
                <th>Milestone</th>
                <th>Invoice</th>
                <th>Info</th>

              </tr>
            </thead>
            <tbody>
              {isBatchLoading ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: "center" }}>
                    No batches to show
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const selectedMilestone = batch.milestones?.[selectedMilestoneIndices[batch._id] || 0] || {};
                  const nhaiToContractorStatus = selectedMilestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus || "pending";
                  const agencyToNhaiStatus = selectedMilestone.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus || "pending";
                  return (
                    <tr key={batch._id} className="batch-table-row">
                      <td>{batch.contractId}</td>
                      <td>{batch.contractTitle}</td>
                      <td>{batch.agencyName}</td>
                      <td>{batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.contractorName || batch.contractorName}</td>
                      <td>{selectedMilestone.bidAmount}</td>
                      <td>{selectedMilestone.bidDuration}</td>
                      <td>₹{batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.amount || batch.contractorValue || "N/A"}</td>
                      <td>{batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.startDate?.split('T')[0] || "N/A"}</td>
                      <td>{batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.endDate?.split('T')[0] || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          style={{
                            opacity: 0.7,
                            cursor: "not-allowed",
                          }}
                        >
                          {(() => {
                            const milestone = batch.milestones?.[selectedMilestoneIndices[batch._id] || 0];
                            if (milestone?.nhaiToContractorPaymentStatus === "completed") {
                              return "Completed";
                            } else if (milestone?.workApproved) {
                              return "Approved";
                            } else if (milestone?.workStatus === "completed") {
                              return "Work Done";
                            } else {
                              return "Pending";
                            }
                          })()}
                        </button>
                      </td>
                      <td className="approval-status-icon">
                        <img
                          src={approval}
                          alt="approval"
                          className="approval-icon"
                          style={{
                            opacity:
                              batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workStatus?.toLowerCase() === "completed" &&
                              !batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workApproved
                                ? 1
                                : 0.6,
                            cursor:
                              batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workStatus?.toLowerCase() === "completed" &&
                              !batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workApproved
                                ? "pointer"
                                : "not-allowed",
                          }}
                          onClick={() =>
                            batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workStatus?.toLowerCase() === "completed" &&
                            !batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.workApproved &&
                            handleWorkApproval(batch._id, selectedMilestoneIndices[batch._id] || 0)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="payinfo-button"
                          disabled={
                            batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed'
                          }
                          style={{
                            cursor: 
                              batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed'
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: 
                              batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed'
                                ? 0.6
                                : 1
                          }}
                          onClick={() => handlePayInfoForm(batch._id)}
                        >
                          {batch.milestones?.[selectedMilestoneIndices[batch._id] || 0]?.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed' 
                            ? 'Payment Completed' 
                            : 'Pay to Contractor'
                          }
                        </button>
                      </td>
                         <td>
                        <div className="milestone-dropdown">
                          <select 
                            className="milestone-select"
                            value={selectedMilestoneIndices[batch._id] || 0}
                            onChange={(e) => setSelectedMilestoneIndices({ ...selectedMilestoneIndices, [batch._id]: Number(e.target.value) })}
                          >
                            {batch.milestones?.map((milestone, index) => (
                              <option key={index} value={index}>
                                Milestone {index + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                         <td>
                        <img
                          src={invoice}
                          alt="invoice"
                          className="invoice-icon"
                          style={{
                            opacity: selectedMilestone?.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === 'completed' ? 1 : 0.7,
                            cursor: selectedMilestone?.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === 'completed'
                              ? "pointer"
                              : "not-allowed",
                          }}
                          onClick={() => handleInvoiceClick(batch)}
                        />
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
                  );
                })
              )}
            </tbody>
          </table>
          <div className="pagination-controls" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginTop: '20px',
            justifyContent: 'right',
            gap: '10px'
          }}>
            <button 
              onClick={() => handleBatchPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage === 1 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => handleBatchPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                backgroundColor: currentPage === totalPages ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* pay info form */}
      {payInfoForm.isOpen && (
        <PayInfoForm
          batchId={payInfoForm.batchId}
          selectedMilestoneIndex={payInfoForm.selectedMilestoneIndex}
          onClose={() => setPayInfoForm({ isOpen: false, batchId: null, selectedMilestoneIndex: null })}
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
               <div className="pagination-controls" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: '20px',
            gap: '10px'
          }}>
            <button 
              onClick={() => handleUserPageChange(userPage - 1)}
              disabled={userPage === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: userPage === 1 ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: userPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ margin: '0 10px' }}>
              Page {userPage} of {userTotalPages}
            </span>
            <button 
              onClick={() => handleUserPageChange(userPage + 1)}
              disabled={userPage === userTotalPages}
              style={{
                padding: '8px 16px',
                backgroundColor: userPage === userTotalPages ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: userPage === userTotalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
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
          message={`Are you sure you want to approve the work for ${approvalDialog.contractorName}'s milestone? This action cannot be undone.`}
          onClose={() => setApprovalDialog({ isOpen: false, batchId: null, milestoneIndex: null, contractorName: null })}
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
              width:"50%"
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
            <Invoice batch={selectedInvoice.batch} selectedMilestone={selectedInvoice.selectedMilestone} />
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
