import React from 'react';
import './Dialog.css';

const Dialog = ({ title, message, onConfirm, onClose }) => {
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-buttons">
          <button onClick={onConfirm} className="confirm-btn">Confirm</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
