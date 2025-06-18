import React, { useState } from "react";
import "./ContractorBatchEditForm.css";
import { toast } from "react-toastify";

const ContractorBatchEditForm = ({ batch, handleContractorBatchForm, onRefresh }) => {
  const [workStatus, setWorkStatus] = useState(batch.selectedMilestone?.workStatus || "pending");
  const [workDetails, setWorkDetails] = useState(batch.selectedMilestone?.workDetails || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batch._id}/milestone-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            milestoneIndex: batch.selectedMilestoneIndex || batch.milestones.findIndex(m => m.contractorId === batch.selectedMilestone.contractorId),
            workStatus,
            workDetails
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Work status updated successfully");
        handleContractorBatchForm(false);
        onRefresh();
      } else {
        toast.error(data.message || "Error updating work status");
      }
    } catch (error) {
      toast.error("Server error. Please try again later.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Update Work Status</h2>
          <button 
            className="close-button"
            onClick={() => handleContractorBatchForm(false)}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="contract-info">
            <p><strong>Contract ID:</strong> {batch.contractId}</p>
            <p><strong>Contract Title:</strong> {batch.contractTitle}</p>
            <p><strong>Milestone:</strong> {batch.selectedMilestone?.heading}</p>
            <p><strong>Amount:</strong> ₹{batch.selectedMilestone?.amount}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Work Status:</label>
              <select
                value={workStatus}
                onChange={(e) => setWorkStatus(e.target.value)}
                required
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="30_percent">30% Complete</option>
                <option value="80_percent">80% Complete</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Work Details:</label>
              <textarea
                value={workDetails}
                onChange={(e) => setWorkDetails(e.target.value)}
                placeholder="Enter work details..."
                rows="4"
                className="work-details"
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="submit-btn">
                Update Status
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => handleContractorBatchForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContractorBatchEditForm;