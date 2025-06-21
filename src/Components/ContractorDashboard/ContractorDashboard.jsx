import React, { useState, useEffect } from "react";
import "./ContractorDashboard.css";
import invoice from "../../Images/invoice.png";
import { useAuth } from "../../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ContractorBatchEditForm from "../ContractorBatchEditForm/ContractorBatchEditForm";
import Invoice from "../Invoice/Invoice";
import infoIcon from "../../Images/info-icon.png";
import InfoModal from "../InfoModal/InfoModal";
import { useNavigate } from 'react-router-dom';

const ContractorDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const [contractorBatchForm, setContractorBatchForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedBatchInfo, setSelectedBatchInfo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectedMilestoneIndices, setSelectedMilestoneIndices] = useState({});

  const navigate = useNavigate();

  const handleInfoClick = (batchId) => {
    navigate(`/tracker/${batchId}`);
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
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
        // Filter batches for the current contractor and get their milestones
        const contractorBatches = data.data.filter(
          (batch) => batch.milestones?.some(milestone => milestone.contractorId === user.id) && batch.status === "approved"
        );
        setBatches(contractorBatches);
      } else {
        toast.error("Error fetching contracts");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleContractorBatchForm = async (batch) => {
    // Find the specific milestone for this contractor
    const contractorMilestones = batch.milestones?.filter(m => m.contractorId === user.id) || [];
    const selectedMilestoneIndex = selectedMilestoneIndices[batch._id] || 0;
    const contractorMilestone = contractorMilestones[selectedMilestoneIndex];
    
    if (contractorMilestone) {
      setContractorBatchForm({
        ...batch,
        selectedMilestone: contractorMilestone,
        selectedMilestoneIndex: selectedMilestoneIndex
      });
    } else {
      setContractorBatchForm(false);
    }
  };
  const refreshBatchInfo = () => setRefreshTrigger(prev => !prev);
  useEffect(() => {
    fetchBatches();
  }, [user.id, refreshTrigger]);

  const filteredBatches = batches.filter(
    (batch) =>
      batch.contractId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.contractTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.agencyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvoiceClick = (batch) => {
    const contractorMilestones = batch.milestones?.filter(m => m.contractorId === user.id) || [];
    const selectedMilestoneIndex = selectedMilestoneIndices[batch._id] || 0;
    const selectedMilestone = contractorMilestones[selectedMilestoneIndex] || {};
    if (selectedMilestone.workStatus === 'completed') {
      setSelectedInvoice(batch);
    } else {
      toast.warning(
        "Invoice will be available after work completion (when status is 'completed')",{
          autoClose: 1000,
        }
      );
    }
  };

  const handleWorkStatusUpdate = async (batchId, milestoneIndex, newStatus) => {
    try {
      // Find the original milestone index from the batch
      const batch = batches.find(b => b._id === batchId);
      if (!batch) {
        toast.error("Batch not found");
        return;
      }

      const contractorMilestones = batch.milestones?.filter(m => m.contractorId === user.id) || [];
      const selectedMilestone = contractorMilestones[milestoneIndex];
      
      if (!selectedMilestone) {
        toast.error("Milestone not found");
        return;
      }

      // Find the original index in the batch.milestones array
      const originalMilestoneIndex = batch.milestones.findIndex(m => 
        m._id === selectedMilestone._id
      );

      if (originalMilestoneIndex === -1) {
        toast.error("Could not find original milestone index");
        return;
      }

      console.log('Updating work status:', {
        batchId,
        filteredIndex: milestoneIndex,
        originalIndex: originalMilestoneIndex,
        milestoneHeading: selectedMilestone.heading,
        newStatus
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}/milestone-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            milestoneIndex: originalMilestoneIndex,
            workStatus: newStatus
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Work status updated to ${newStatus}`);
        fetchBatches(); // Refresh the data
      } else {
        toast.error(data.message || "Error updating work status");
      }
    } catch (error) {
      console.error('Error updating work status:', error);
      toast.error("Server error. Please try again later.");
    }
  };

  return (
    <div className="contractor-dashboard">
      <div className="dashboard-header">
        <h1>Contractor Dashboard</h1>
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
                <th>Agency Name</th>
                <th>Admin</th>
                <th>Contractor Amount</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Invoice</th>
                <th>Pay Info</th>
                <th>Milestone</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    Loading...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    No contracts found
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const contractorMilestones = batch.milestones?.filter(m => m.contractorId === user.id) || [];
                  const selectedMilestoneIndex = selectedMilestoneIndices[batch._id] || 0;
                  const selectedMilestone = contractorMilestones[selectedMilestoneIndex] || {};
                  
                  // Debug logging
                  console.log(`Batch ${batch.contractId}:`, {
                    contractorMilestones: contractorMilestones.length,
                    selectedMilestoneIndex,
                    selectedMilestone: selectedMilestone.heading || 'N/A'
                  });
                  
                  return (
                    <tr key={batch._id}>
                      <td>{batch.contractId}</td>
                      <td>{batch.contractTitle}</td>
                      <td>{batch.agencyName}</td>
                      <td>{batch.adminName || "Admin"}</td>
                      <td>₹{selectedMilestone.amount || "N/A"}</td>
                      <td>{selectedMilestone.startDate?.split('T')[0] || "N/A"}</td>
                      <td>{selectedMilestone.endDate?.split('T')[0] || "N/A"}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleContractorBatchForm(batch)}
                          disabled={selectedMilestone.workStatus === "completed"}
                          style={{
                            opacity: selectedMilestone.workStatus === "completed" ? 0.7 : 1,
                            cursor:
                              selectedMilestone.workStatus === "completed"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          {selectedMilestone.workStatus || "Pending"}
                        </button>
                      </td>
                      <td>
                        <img
                          src={invoice}
                          alt="invoice"
                          className="invoice-icon"
                          style={{
                            opacity: selectedMilestone.workStatus === "completed" ? 1 : 0.7,
                            cursor: selectedMilestone.workStatus === "completed"
                              ? "pointer"
                              : "not-allowed",
                          }}
                          onClick={() => handleInvoiceClick(batch)}
                        />
                      </td>
                      <td>
                        <img
                          src={infoIcon}
                          alt="info"
                          className="info-icon"
                          onClick={() => handleInfoClick(batch._id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        {contractorMilestones.length > 1 ? (
                          <select 
                            value={selectedMilestoneIndex}
                            onChange={(e) => setSelectedMilestoneIndices({
                              ...selectedMilestoneIndices,
                              [batch._id]: Number(e.target.value)
                            })}
                            style={{ padding: '4px', width: '100%' }}
                          >
                            {contractorMilestones.map((milestone, index) => (
                              <option key={index} value={index}>
                                Milestone {index + 1}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>Milestone 1</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* invoice modal */}
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
      {contractorBatchForm && (
        <ContractorBatchEditForm
          batch={contractorBatchForm}
          handleContractorBatchForm={handleContractorBatchForm}
          onRefresh={refreshBatchInfo}
        />
      )}

      {/* Info Modal */}
      {selectedBatchInfo && (
        <InfoModal
          batch={selectedBatchInfo}
          onClose={() => setSelectedBatchInfo(null)}
          refreshTrigger={refreshTrigger}
        />
      )}
      <ToastContainer autoClose={1000} />
    </div>
  );
};

export default ContractorDashboard;
