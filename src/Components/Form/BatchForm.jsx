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
        `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/users`,
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
          status: 'pending'
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
      status: "pending"
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
      const selectedContractor = contractors.find(c => c._id === formData.contractor);

      if (!selectedAgency || !selectedContractor) {
        toast.error('Please select both agency and contractor');
        return;
      }

      const batchData = {
        contractTitle: formData.title,
        contractId: formData.contractId,
        bidValue: parseFloat(formData.ContractBid),
        contractorValue: parseFloat(formData.ContractorAmount),
        bidDuration: formData.ContractDuration,
        agencyId: selectedAgency._id,
        agencyName: selectedAgency.name,
        contractorId: selectedContractor._id,
        contractorName: selectedContractor.name,
        status: formData.status,
        milestones: formData.milestones
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
          const newbatch3 = {
          batchId: data?.data?._id,
          contractId: data?.data?.contractId,
          contractName: data?.data?.contractorName,
          contractLocation: data?.data?.contractLocation || 'noida',
          actualAmount: data?.data?.contractorValue || '0',
          totalDuration: data?.data?.bidDuration || '0',
          numberofmilestones: data?.data?.numberofmilestones || 6,
            milestones: [
              {
                "milestoneNo": 2,
                "amount": 500000,
                "description": "Initial ground work",
                "lastDate": "2025-08-01",
                "nhaiPaymentDetail": {
                  "transactionId": "",
                  "status": "",
                  "remark": "",
                  "paymentDate": "",
                  "invoiced": false
                },
                "agencyPaymentDetail": {
                  "transactionId": "",
                  "status": "",
                  "remark": "",
                  "paymentDate": "",
                  "invoiced": false
                },
                "status": "PENDING"
              }
            ],
            contractors: [
              {
                contractorId: selectedContractor ? selectedContractor._id : '',
                contractorAmount: parseFloat(formData.ContractorAmount),
                milestonesAssigned: [1, 2],
                paymentApproved: false
              }
            ]
        }
         const response = await fetch(
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
    <div className="overlay">
      <form className="batch-form" onSubmit={handleSubmit}>
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
        <input
          type="number"
          name="ContractBid"
          placeholder="Contract Bid"
          value={formData.ContractBid}
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
            Add Milestones
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
          <div className="milestone-form">
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="milestone-section">
                <div 
                  className="milestone-header"
                  onClick={() => toggleMilestone(index)}
                >
                  <h3>Milestone {index + 1}</h3>
                  <span className="toggle-icon">
                    {expandedMilestones[index] ? '▼' : '▲'}
                  </span>
                </div>
                
                {expandedMilestones[index] && (
                  <div className="milestone-content">
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
                      <label>Amount:</label>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                        placeholder="Enter milestone amount"
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