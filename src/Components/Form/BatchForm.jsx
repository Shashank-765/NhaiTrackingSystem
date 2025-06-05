import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify';
import './Form.css'

const BatchForm = ({ handleCloseBatchForm }) => {
  const [agencies, setAgencies] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    contractId: '',
    ContractBid: '',
    ContractorAmount: '',
    ContractDuration: '',
    agency: '',
    contractor: '',
    status: 'pending'
  });

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      console.log('Fetched data:', data);

      if (data.success) {
        const agencyUsers = data.data.filter(user => user.role.toLowerCase() === 'agency');
        const contractorUsers = data.data.filter(user => user.role.toLowerCase() === 'contractor');
        
        console.log('Agencies found:', agencyUsers);
        console.log('Contractors found:', contractorUsers);
        
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Find selected agency and contractor objects
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
        status: formData.status
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/batches/create`,
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
        <input
          type="number" 
          name="ContractorAmount"
          placeholder="Contractor Amount"
          value={formData.ContractorAmount}
          onChange={handleChange}
          required
        />
        <input 
          type="text" 
          name="ContractDuration"
          placeholder="Contract Duration"
          value={formData.ContractDuration}
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
              {agencies.length > 0 ? (
                agencies.map((agency) => (
                  <option key={agency._id} value={agency._id}>
                    {agency.name} 
                    {/* ({agency.uniqueId}) */}
                  </option>
                ))
              ) : (
                <option value="" disabled>No agencies found</option>
              )}
            </select>

            <select 
              name="contractor"
              value={formData.contractor}
              onChange={handleChange}
              required
            >
              <option value="">Select Contractor</option>
              {contractors.length > 0 ? (
                contractors.map((contractor) => (
                  <option key={contractor._id} value={contractor._id}>
                    {contractor.name}
                     {/* ({contractor.uniqueId}) */}
                  </option>
                ))
              ) : (
                <option value="" disabled>No contractors found</option>
              )}
            </select>
          </>
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
            onClick={e => handleCloseBatchForm(e)}
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