import React, {useRef, useState, useEffect} from 'react';
import './InfoModal.css';

const InfoModal = ({ batch, onClose, refreshTrigger }) => {
  const overlayRef = useRef();
  const [batchData, setBatchData] = useState(batch);

  useEffect(() => {
    const fetchLatestBatchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setBatchData(data.data);
        }
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchLatestBatchData();
  }, [refreshTrigger, batch._id]);

  const handleOverlayClick = (e) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString() : 'Not Available';
  };

  return (
    <div className="info-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="info-modal">
        <h2>Batch Information</h2>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>

        <div className="info-group">
          <label>Contract Title</label>
          <span>{batchData.contractTitle}</span>
        </div>

        <div className="info-group">
          <label>Agency Name</label>
          <span>{batchData.agencyName}</span>
        </div>

        <div className="info-group">
          <label>Contractor Name</label>
          <span>{batchData.contractorName}</span>
        </div>

        <div className="info-group">
          <label>Contractor Amount</label>
          <span>₹{batchData.contractorValue}</span>
        </div>

        <div className="info-group">
          <label>Payment Status</label>
          <span>{batchData.paymentStatus === 'completed' ? 'Completed' : 'Pending'}</span>
        </div>

        {batchData.transactionId && (
          <div className="info-group">
            <label>Transaction ID</label>
            <span>{batchData.transactionId}</span>
          </div>
        )}

        {batchData.transactionDate && (
          <div className="info-group">
            <label>Transaction Date</label>
            <span>{formatDate(batchData.transactionDate)}</span>
          </div>
        )}

        {batchData.transactionTime && (
          <div className="info-group">
            <label>Transaction Time</label>
            <span>{new Date(batchData.transactionTime).toLocaleString()}</span>
          </div>
        )}

        {batchData.paymentMedia && (
          <div className="info-group">
            <label>Payment Media</label>
            {batchData.paymentMedia.endsWith('.pdf') ? (
              <a href={batchData.paymentMedia} target="_blank" rel="noopener noreferrer">View PDF</a>
            ) : (
              <img
                src={batchData.paymentMedia}
                alt="Payment Media"
                style={{ maxWidth: '200px', maxHeight: '200px', display: 'block', marginTop: 8 }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoModal;
