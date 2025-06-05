import React, { useState, useEffect } from 'react'
import "./ContractorBatchEditForm.css"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ContractorBatchEditForm = ({batch, handleContractorBatchForm}) => {
    const [formData, setFormData] = useState({
        workDetails: batch.workDetails || '',
        workStatus: batch.workStatus || 'pending'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/work-details`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        workDetails: formData.workDetails,
                        workStatus: formData.workStatus
                    }),
                }
            );

            const data = await response.json();
            toast.dismiss();
            if (data.success) {
                toast.success('Work saved successfully',{
                    autoClose: 1000,
                });
                // Close form and trigger refresh
                handleContractorBatchForm();
            } else {
                toast.error(data.message || 'Error updating work details',{
                    autoClose:1000,
                });
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Server error. Please try again later.',{
                    autoClose:1000,
                });
        }
    };

    return (
        <div className='overlay'>
            <form onSubmit={handleSubmit} className='contractor-batch-edit-form'>
            <h2>Edit Contractor Batch</h2>
            <div className="form-group">
                <label htmlFor="contractId">Contract ID: </label>
                <input type="text" id="contractId" name="contractId" value={batch.contractId} disabled/>
            </div>
            <div className="form-group">
                <label htmlFor="contractTitle">Contract Title: </label>
                <input type="text" id="contractTitle" name="contractTitle" value={batch.contractTitle} disabled/>
            </div>
            <div className="form-group">
                <label htmlFor="agencyName">Agency Name: </label>
                <input type="text" id="agencyName" name="agencyName" value={batch.agencyName} disabled/>
            </div>            <div className="form-group">
                <label htmlFor="workDetails">Work:</label>
                <textarea 
                    name="workDetails" 
                    id="workDetails" 
                    rows="4"
                    value={formData.workDetails}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="form-group">
                <label htmlFor="workStatus">Work Status:</label>
                <select 
                    name="workStatus" 
                    id="workStatus"
                    value={formData.workStatus}
                    onChange={handleChange}
                >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div className="button-div">
                <button type="button" className='cancel-btn' onClick={() => handleContractorBatchForm()}>Cancel</button>
                <button type="submit" className='confirm-btn'>Save Changes</button>            </div>
        </form>
        {/* <ToastContainer /> */}
    </div>
  )
}

export default ContractorBatchEditForm