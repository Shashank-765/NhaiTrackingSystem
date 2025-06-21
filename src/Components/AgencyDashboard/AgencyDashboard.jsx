import React, { useState, useEffect } from "react";
import "./AgencyDashboard.css";
import { useAuth } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InfoModal from "../InfoModal/InfoModal";
import infoIcon from "../../Images/info-icon.png";
import Dialog from "../Dialog/Dialog";
import PayInfoForm from "../PayInfoForm/PayInfoForm";
import { useNavigate } from 'react-router-dom';

const AgencyDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMilestoneIndices, setSelectedMilestoneIndices] = useState({});
  const { user } = useAuth();
  const [confirmDialog, setConfirmDialog] = useState({
      isOpen: false,
      batchId: null,
      currentStatus: "",
      newStatus: "",
    });
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const [payInfoForm, setPayInfoForm] = useState({
    isOpen: false,
    batchId: null,
  });

  const refreshBatchInfo = () => setRefreshTrigger((prev) => !prev);

  const navigate = useNavigate();

  const handleInfoClick = (batchId) => {
    navigate(`/tracker/${batchId}`);
  };

  const handlePayInfoForm = (batchId, milestoneIndex) => {
    const batch = batches.find((batch) => batch._id === batchId);
    if (!batch) return;

    const milestone = batch.milestones[milestoneIndex];
    if (!milestone) return;

    // Check if payment is already completed
    if (milestone.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === "completed") {
      toast.warning('Payment is already done for this milestone');
      return;
    }
    
    setPayInfoForm({ isOpen: true, batchId, selectedMilestoneIndex: milestoneIndex });
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Filter batches for the current agency
        const agencyBatches = data.data.filter(
          (batch) => batch.agencyId === user.id
        );
        setBatches(agencyBatches);
      } else {
        toast.error("Error fetching contracts", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error("Server error. Please try again later.", {
        autoClose: 1000,
      });
    } finally {
      setIsLoading(false);
    }
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
          `${import.meta.env.VITE_API_URL}/${
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
          toast.success(`Batch status updated to ${newStatus}`,{
            autoClose: 1000,
          });
        } else {
          // Revert optimistic update on failure
          updatedBatches[batchIndex].status = originalStatus;
          setBatches(updatedBatches);
          toast.error(data.message || "Error updating batch status",{
            autoClose: 1000,
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        updatedBatches[batchIndex].status = originalStatus;
        setBatches(updatedBatches);
        toast.error("Server error. Please try again later.",{
          autoClose: 1000,
        });
      }
  
      setConfirmDialog({
        isOpen: false,
        batchId: null,
        currentStatus: "",
        newStatus: "",
      });
    };

  useEffect(() => {
    fetchBatches();
  }, [user.id]);

  const filteredBatches = batches.filter(
    (batch) =>
      batch.contractId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.contractTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.contractorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const initiateStatusUpdate = (batchId, currentStatus) => {
      // Only allow status update if current status is pending
      if (currentStatus.toLowerCase() !== "pending") {
        // console.log('approved pr click')
        toast.warning("Only pending batches can be updated",{
          autoClose: 1000,
        });
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

  return (
    <div className="agency-dashboard">
      <div className="dashboard-header">
        <h1>Agency Dashboard</h1>
      </div>
      <div className="batch-section">
        <div className="batch-section-heading">
          <h2>Contract Overview</h2>
          <div className="search-create">
            <input
              type="text"
              placeholder="Search in Contracts"
              className="batch-searchbox"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="batch-table" cellSpacing={0}>
            <thead>
              <tr>
                <th>ContractId</th>
                <th>Title</th>
                <th>Contractor Name</th>
                <th>Bid Amount</th>
                <th>Bid Duration</th>
                <th>Status</th>
                <th>Pay to NHAI</th>
                <th>Info</th>
                <th>Milestone</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No contracts found
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const selectedMilestone = batch.milestones[selectedMilestoneIndices[batch._id] || 0];
                  const canPay = selectedMilestone?.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus !== "completed";
                  return (
                    <tr key={batch._id}>
                      <td>{batch.contractId}</td>
                      <td>{batch.contractTitle}</td>
                      <td>{selectedMilestone?.contractorName}</td>
                      <td>{selectedMilestone?.bidDuration}</td>
                      <td>₹{selectedMilestone?.bidAmount}</td>
                      <td>
                        {/* <button
                          type="button"
                          className="edit-btn"
                          style={{
                            opacity: batch.status === "approved" ? 0.7 : 1,
                            cursor:
                              batch.status === "approved"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {batch.status === "pending" ? "Pending" : "Approved"}
                        </button> */}
                        <button
                          className={`status-btn ${batch.status.toLowerCase()}`}
                          onClick={() =>
                            initiateStatusUpdate(batch._id, batch.status)
                          }
                          // disabled={batch.status.toLowerCase() !== "pending"}
                        >
                          {batch.status === "pending" ? "Pending" : "Approved"}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="payinfo-button"
                          disabled={!canPay}
                          onClick={() => handlePayInfoForm(batch._id, selectedMilestoneIndices[batch._id] || 0)}
                        >
                          {selectedMilestone?.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === "completed"
                            ? "Payment Completed"
                            : "Pay to NHAI"}
                        </button>
                      </td>
                      <td>
                        <img
                          src={infoIcon}
                          alt="Info"
                          className="info-icon"
                          onClick={() => handleInfoClick(batch._id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <div className="milestone-dropdown">
                          <select
                            className="milestone-select"
                            value={selectedMilestoneIndices[batch._id] || 0}
                            onChange={e =>
                              setSelectedMilestoneIndices({
                                ...selectedMilestoneIndices,
                                [batch._id]: Number(e.target.value)
                              })
                            }
                          >
                            {batch.milestones.map((m, idx) => (
                              <option key={idx} value={idx}>
                                Milestone {idx + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Modal */}
      {/* PayInfoForm example usage, add onSuccess if used here */}
      
      {payInfoForm.isOpen && 
      <PayInfoForm
        batchId={payInfoForm.batchId}
        selectedMilestoneIndex={payInfoForm.selectedMilestoneIndex}
        onClose={() => setPayInfoForm({ isOpen: false, batchId: null, selectedMilestoneIndex: null })}
        onSuccess={refreshBatchInfo}
      />}
     
      {confirmDialog.isOpen && (
        <Dialog
          message={`Are you sure you want to change the status to ${confirmDialog.newStatus}?`}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={handleStatusUpdate}
        />
      )}
    </div>
  );
};

export default AgencyDashboard;