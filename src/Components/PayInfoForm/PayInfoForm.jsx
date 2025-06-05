import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PayInfoForm.css";
import { useAuth } from "../../context/AuthContext";

const PayInfoForm = ({ batchId, onClose, onSuccess }) => {
  const [batch, setBatch] = useState(null);
  const [formData, setFormData] = useState({
    transactionId: "",
    transactionDate: new Date().toISOString().split("T")[0],

    // transactionId of agency to nhai
    agencyToNhaiTransactionId: "",
    agencyToNhaiTransactionDate: new Date().toISOString().split("T")[0],

    // transactionId of nhai to contractor
    nhaiToContractorTransactionId: "",
    nhaiToContractorTransactionDate: new Date().toISOString().split("T")[0],
  });
  const [mediaFile, setMediaFile] = useState(null);
  const overlayRef = useRef();
  const { user } = useAuth();
  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        // console.log("API URL:", import.meta.env.VITE_API_URL);
        // console.log("API Version:", import.meta.env.VITE_API_VERSION);
        // console.log("Batch ID:", batchId);
        // console.log("Token:", localStorage.getItem("token"));

        const url = `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}`;
        // console.log("Full URL:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();

        if (data.success) {
          setBatch(data.data);
        } else {
          toast.error(data.message || "Error fetching batch details");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error fetching batch details");
      }
    };

    fetchBatchDetails();
  }, [batchId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image (jpg, jpeg, png) or PDF files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than or equal to 2MB.");
      return;
    }
    setMediaFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      // Common fields
      form.append("batchId", batchId);
      // form.append("transactionId", formData.transactionId);
      // form.append("transactionDate", formData.transactionDate);
      // if (mediaFile) form.append("media", mediaFile);

      // Handle Agency to NHAI payment
      if (user.role.toLowerCase() === 'agency') {
        if (!formData.transactionId || !formData.transactionDate) {
          toast.error('Please fill in all required fields',{
            autoClose: 1000,
          });
          return;
        }
      
      // form.append('transactionId', formData.agencyToNhaiTransactionId);
      form.append('transactionId', formData.transactionId);
      // form.append('transactionDate', formData.agencyToNhaiTransactionDate);
      form.append('transactionDate', formData.transactionDate);
      form.append('transactionType', 'agency_to_nhai');
      
      if (mediaFile) {
        form.append('media', mediaFile);
      } else if (!batch.paymentMedia) {
        toast.error('Please upload payment proof',{
          autoClose: 1000,
        });
        return;
      }
      }


       // Handle NHAI to Contractor payment
    if (user.role.toLowerCase() === 'admin') {
      if (!formData.transactionId || !formData.transactionDate) {
        toast.error('Please fill in all required fields',{autoClose: 1000});
        return;
      }
      
      // form.append('transactionId', formData.nhaiToContractorTransactionId);
      form.append('transactionId', formData.transactionId);
      // form.append('transactionDate', formData.nhaiToContractorTransactionDate);
      form.append('transactionDate', formData.transactionDate);
      form.append('transactionType', 'nhai_to_contractor');
      
      if (mediaFile) {
        form.append('media', mediaFile);
      } else if (!batch.paymentMedia) {
        toast.error('Please upload payment proof',{
          autoClose: 1000,
        });
        return;
      }
    }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${
          import.meta.env.VITE_API_VERSION
        }/batches/${batchId}/payment`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: form,
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Payment information updated successfully",{
          autoClose: 1000,
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Error updating payment information",{
          autoClose: 1000,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error updating payment information",{
        autoClose: 1000,
      });
    }
  };

  const handleOverlayClick = (e) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!batch) {
    return null;
  }

  return (
    <div
      className="payinfo-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="payinfo-form">
        <h2>Payment Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Contract Title</label>
            <input type="text" value={batch.contractTitle} disabled />
          </div>

          <div className="form-group">
            <label>Agency Name</label>
            <input type="text" value={batch.agencyName} disabled />
          </div>

          <div className="form-group">
            <label>Contractor Name</label>
            <input type="text" value={batch.contractorName} disabled />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="text"
              value={`₹${batch.bidValue.toLocaleString()}`}
              disabled
            />
          </div>

          {/* form-group for transaction id and transaction date made by agency to nhai*/}
          {user.role.toLowerCase() === "agency" && (
            <>
              <div className="form-group">
                <label>Transaction ID (to NHAI) *</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionId: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="form-group">
                <label>Transaction Date (to NHAI) *</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Payment Media (Image/PDF, max 2MB)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  required={!batch.paymentMedia}
                />
                {mediaFile && (
                  <div style={{ fontSize: "0.9rem", marginTop: 4 }}>
                    Selected: {mediaFile.name}
                    {mediaFile.type.startsWith("image/") && (
                      <img
                        src={URL.createObjectURL(mediaFile)}
                        alt="Preview"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          display: "block",
                          marginTop: 8,
                        }}
                      />
                    )}
                    {mediaFile.type === "application/pdf" && (
                      <a
                        href={URL.createObjectURL(mediaFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preview PDF
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Show uploaded payment media if present */}
              {batch.paymentMedia && (
                <div className="form-group">
                  <label>Uploaded Payment Media:</label>
                  {batch.paymentMedia.endsWith(".pdf") ? (
                    <a
                      href={batch.paymentMedia}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  ) : (
                    <img
                      src={batch.paymentMedia}
                      alt="Payment Media"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        display: "block",
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {/* form-group for transaction id and transaction date made by nhai to contractor*/}
          {user.role.toLowerCase() === "admin" && (
            <>
              <div className="form-group">
                <label>Transaction ID (to Contractor) *</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionId: e.target.value,
                    })
                  }
                  required
                  placeholder="Enter transaction ID"
                />
              </div>

              <div className="form-group">
                <label>Transaction Date (to Contractor) *</label>
                <input
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transactionDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Payment Media (Image/PDF, max 2MB)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileChange}
                  required={!batch.paymentMedia}
                />
                {mediaFile && (
                  <div style={{ fontSize: "0.9rem", marginTop: 4 }}>
                    Selected: {mediaFile.name}
                    {mediaFile.type.startsWith("image/") && (
                      <img
                        src={URL.createObjectURL(mediaFile)}
                        alt="Preview"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          display: "block",
                          marginTop: 8,
                        }}
                      />
                    )}
                    {mediaFile.type === "application/pdf" && (
                      <a
                        href={URL.createObjectURL(mediaFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preview PDF
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Show uploaded payment media if present */}
              {batch.paymentMedia && (
                <div className="form-group">
                  <label>Uploaded Payment Media:</label>
                  {batch.paymentMedia.endsWith(".pdf") ? (
                    <a
                      href={batch.paymentMedia}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  ) : (
                    <img
                      src={batch.paymentMedia}
                      alt="Payment Media"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        display: "block",
                        marginTop: 8,
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayInfoForm;
