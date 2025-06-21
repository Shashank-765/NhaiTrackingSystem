import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify';
import './Form.css'
import { millisecondsToSeconds } from 'framer-motion';

const BatchForm = ({ handleCloseBatchForm }) => {
  const [agencies, setAgencies] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(1);
  const [expandedMilestones, setExpandedMilestones] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    contractId: '',
    ContractBid: '',
    ContractorAmount: '',
    ContractDuration: '',
    agency: '',
    contractor: '',
    status: 'pending',
    milestones: []
  });

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/users/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      console.log('Fetched data:', data);

      if (data.success) {
        const agencyUsers = data?.data?.filter(user => user.role.toLowerCase() === 'agency');
        const contractorUsers = data?.data?.filter(user => user.role.toLowerCase() === 'contractor');

        setAgencies(agencyUsers);
        setContractors(contractorUsers);
      } else {
        toast.error("Error fetching users");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMilestoneChange = (index, field, value) => {
    setFormData(prev => {
      const updatedMilestones = [...prev.milestones];
      if (!updatedMilestones[index]) {
        updatedMilestones[index] = {
          contractorId: '',
          amount: '',
          heading: '',
          status: 'pending',
          startDate: '',
          endDate: '',
          bidAmount: '',
          bidDuration: ''
        };
      }
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        [field]: value
      };
      return {
        ...prev,
        milestones: updatedMilestones
      };
    });
  };

  const handleMilestoneCountChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setMilestoneCount(count);
    
    // Initialize or update milestones array based on count
    const newMilestones = Array(count).fill().map((_, index) => ({
      contractorId: "",
      amount: "",
      heading: "",
      status: "pending",
      startDate: "",
      endDate: "",
      bidAmount: "",
      bidDuration: ""
    }));
    
    setFormData(prev => ({
      ...prev,
      milestones: newMilestones
    }));

    // Initialize expanded state for new milestones - all closed by default
    const newExpandedState = {};
    for (let i = 0; i < count; i++) {
      newExpandedState[i] = false;
    }
    setExpandedMilestones(newExpandedState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedAgency = agencies.find(a => a._id === formData.agency);

      if (!selectedAgency) {
        toast.error('Please select an agency');
        return;
      }

      // Validate milestones
      if (formData.milestones.length > 0) {
        for (const milestone of formData.milestones) {
          if (!milestone.heading || !milestone.contractorId || !milestone.amount || !milestone.startDate || !milestone.endDate || !milestone.bidAmount) {
            toast.error('Please fill all required fields in milestones');
            return;
          }

          // Validate dates
          const startDate = new Date(milestone.startDate);
          const endDate = new Date(milestone.endDate);
          
          if (endDate < startDate) {
            toast.error('End date must be after start date for each milestone');
            return;
          }

          // Get contractor name for the milestone
          const milestoneContractor = contractors.find(c => c._id === milestone.contractorId);
          if (!milestoneContractor) {
            toast.error('Invalid contractor selected for milestone');
            return;
          }
          milestone.contractorName = milestoneContractor.name;
        }
      } else {
        toast.error('Please add at least one milestone');
        return;
      }

      const batchData = {
        contractTitle: formData.title,
        contractId: formData.contractId,
        agencyId: selectedAgency._id,
        agencyName: selectedAgency.name,
        status: formData.status,
        milestones: formData.milestones.map(milestone => ({
          heading: milestone.heading,
          contractorValue: parseFloat(formData.ContractorAmount),
          contractorId: milestone.contractorId,
          contractorName: milestone.contractorName,
          amount: parseFloat(milestone.amount),
          bidAmount: parseFloat(milestone.bidAmount),
          bidDuration: milestone.bidDuration,
          startDate: milestone.startDate,
          endDate: milestone.endDate,
          status: milestone.status
        }))
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(batchData)
        }
      );
      
      const data = await response.json();

      if (data.success) {
        // Create a map of contractors and their milestones
        const contractorMilestones = {};
        formData.milestones.forEach((milestone, index) => {
          if (!contractorMilestones[milestone.contractorId]) {
            contractorMilestones[milestone.contractorId] = {
              contractorId: milestone.contractorId,
              contractorName: milestone.contractorName,
              contractorAmount: 0,
              milestonesAssigned: []
            };
          }
          contractorMilestones[milestone.contractorId].contractorAmount += parseFloat(milestone.amount);
          contractorMilestones[milestone.contractorId].milestonesAssigned.push(index + 1);
        });

        const newbatch3 = {
          batchId: data?.data?._id,
          contractId: data?.data?.contractId,
          contractName: data?.data?.contractTitle,
          contractLocation: data?.data?.contractLocation || 'noida',
          actualAmount: data?.data?.contractorValue || '0',
          totalDuration: data?.data?.bidDuration || '0',
          numberofmilestones: formData.milestones.length,
          milestones: formData.milestones.map((milestone, index) => ({
            milestoneNo: index + 1,
            amount: parseFloat(milestone.amount),
            description: milestone.heading,
            lastDate: milestone.endDate,
            nhaiPaymentDetail: {
              transactionId: "",
              status: "",
              remark: "",
              paymentDate: "",
              invoiced: false
            },
            agencyPaymentDetail: {
              transactionId: "",
              status: "",
              remark: "",
              paymentDate: "",
              invoiced: false
            },
            status: "PENDING"
          })),
          contractors: Object.values(contractorMilestones).map(contractor => ({
            ...contractor,
            paymentApproved: false
          }))
        };

        const response2 = await fetch(
          `${import.meta.env.VITE_API_URL2}/batch`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newbatch3)
          }
        );
        
        toast.success('Batch created successfully');
        handleCloseBatchForm();
      } else {
        toast.error(data.message || 'Error creating batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Server error. Please try again later.');
    }
  };

  const toggleMilestone = (index) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <form className="batch-form" onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        scrollbarWidth: 'thin',
        scrollbarColor: '#888 #f1f1f1'
      }}>
        <style>
          {`
            .batch-form::-webkit-scrollbar {
              width: 8px;
            }
            .batch-form::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            .batch-form::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 4px;
            }
            .batch-form::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
            .milestone-form {
              maxHeight: 60vh;
              overflowY: 'auto';
              paddingRight: 10px;
            }
            .milestone-form::-webkit-scrollbar {
              width: 6px;
            }
            .milestone-form::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 3px;
            }
            .milestone-form::-webkit-scrollbar-thumb {
              background: #ccc;
              border-radius: 3px;
            }
            .milestone-form::-webkit-scrollbar-thumb:hover {
              background: #999;
            }
          `}
        </style>
        <h2>Add Batch</h2>
        <input
          type="text"
          name="title"
          placeholder="Contract Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="contractId"
          placeholder="Contract ID"
          value={formData.contractId}
          onChange={handleChange}
          required
        />
        {isLoading ? (
          <div>Loading users...</div>
        ) : (
          <>
            <select
              name="agency"
              value={formData.agency}
              onChange={handleChange}
              required
            >
              <option value="">Select Agency</option>
              {agencies.map((agency) => (
                <option key={agency._id} value={agency._id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowMilestoneForm(!showMilestoneForm)}
            className="milestone-btn"
          >
            No. of Milestones
          </button>
          <input
            type="number"
            min="1"
            max="10"
            value={milestoneCount}
            onChange={handleMilestoneCountChange}
            placeholder="No. of milestones"
            style={{ width: '100px', padding: '8px' }}
          />
        </div>

        {showMilestoneForm && (
          <div className="milestone-form" style={{
            marginTop: '20px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: '#f9f9f9'
          }}>
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="milestone-section" style={{
                marginBottom: '15px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                overflow: 'hidden',
                backgroundColor: 'white'
              }}>
                <div 
                  className="milestone-header"
                  onClick={() => toggleMilestone(index)}
                  style={{
                    padding: '12px 15px',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: expandedMilestones[index] ? '1px solid #ddd' : 'none'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Milestone {index + 1}</h3>
                  <span className="toggle-icon" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {expandedMilestones[index] ? '▼' : '▲'}
                  </span>
                </div>
                
                {expandedMilestones[index] && (
                  <div className="milestone-content" style={{
                    padding: '20px',
                    backgroundColor: 'white'
                  }}>
                    <div className="form-group">
                      <label>Heading:</label>
                      <input
                        type="text"
                        value={milestone.heading}
                        onChange={(e) => handleMilestoneChange(index, 'heading', e.target.value)}
                        placeholder="Enter milestone heading"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contractor:</label>
                      <select
                        value={milestone.contractorId}
                        onChange={(e) => handleMilestoneChange(index, 'contractorId', e.target.value)}
                      >
                        <option value="">Select Contractor</option>
                        {contractors.map(contractor => (
                          <option key={contractor._id} value={contractor._id}>
                            {contractor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Bid Amount:</label>
                      <input
                        type="number"
                        value={milestone.bidAmount}
                        onChange={(e) => handleMilestoneChange(index, 'bidAmount', e.target.value)}
                        placeholder="Enter bid amount"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bid Duration:</label>
                      <input
                        type="text"
                        value={milestone.bidDuration}
                        onChange={(e) => handleMilestoneChange(index, 'bidDuration', e.target.value)}
                        placeholder="Enter bid duration"
                      />
                    </div>
                    <div className="form-group">
                      <label>Contractor Amount:</label>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                        placeholder="Enter milestone amount for contractor"
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Date:</label>
                      <input
                        type="date"
                        value={milestone.startDate}
                        onChange={(e) => handleMilestoneChange(index, 'startDate', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date:</label>
                      <input
                        type="date"
                        value={milestone.endDate}
                        onChange={(e) => handleMilestoneChange(index, 'endDate', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        value={milestone.status}
                        onChange={(e) => handleMilestoneChange(index, 'status', e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          <option value="">Select Status</option>
          <option value="pending">Pending</option>
        </select>

        <div className="button-div">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCloseBatchForm}
          >
            Cancel
          </button>
          <button type="submit" className="primary-btn">
            Add Batch
          </button>
        </div>
      </form>
    </div>
  )
}

export default BatchForm