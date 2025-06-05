import React from 'react';
import './Tracker.css';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Tracker = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role);
  }, []);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/${
            import.meta.env.VITE_API_VERSION
          }/batches/${batchId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error fetching batch data: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
          setBatch(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch batch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  const getSteps = () => {
    if (!batch) return [];

    const baseSteps = [
      {
        heading: 'Admin created batch',
        description: `Contract Title: ${batch.contractTitle}, Contract ID: ${batch.contractId}`,
        visibleTo: ['admin', 'Agency', 'Contractor']
      }
    ];

    // Agency to Admin Payment step
    baseSteps.push({
      heading: 'Agency to Admin Payment',
      description: `Status: ${batch.agencyToNhaiPaymentStatus || 'N/A'}${
        batch.agencyToNhaiTransactionId ? ', Transaction ID: ' + batch.agencyToNhaiTransactionId : ''
      }${
        batch.agencyToNhaiTransactionDate ? ', Date: ' + new Date(batch.agencyToNhaiTransactionDate).toLocaleDateString() : ''
      }`,
      visibleTo: ['admin', 'Agency']
    });

    // Contractor Work Flow step
    baseSteps.push({
      heading: 'Contractor Work Flow',
      description: `Status: ${batch.workStatus || 'N/A'}, Details: ${batch.workDetails || 'N/A'}${
        batch.completedAt ? ', Completed On: ' + new Date(batch.completedAt).toLocaleDateString() : ''
      }`,
      visibleTo: ['admin', 'Contractor']
    });

    // Admin to Contractor Payment step
    baseSteps.push({
      heading: 'Admin to Contractor Payment',
      description: `Status: ${batch.nhaiToContractorPaymentStatus || 'N/A'}${
        batch.nhaiToContractorTransactionId ? ', Transaction ID: ' + batch.nhaiToContractorTransactionId : ''
      }${
        batch.nhaiToContractorTransactionDate ? ', Date: ' + new Date(batch.nhaiToContractorTransactionDate).toLocaleDateString() : ''
      }`,
      visibleTo: ['admin', 'Contractor']
    });

   
    if (userRole === 'admin') {
      return baseSteps;
    }

    return baseSteps.filter(step => step.visibleTo.includes(userRole));
  };

  const getCurrentStep = () => {
    if (!batch) return 0;

    const steps = getSteps();
    let currentStep = 0;

    currentStep = 1;
    if (batch.agencyToNhaiPaymentStatus === 'completed' && (userRole === 'admin' || userRole === 'Agency')) {
      currentStep = 2;
    }
    if (batch.workStatus === 'completed' && (userRole === 'admin' || userRole === 'Contractor')) {
      currentStep = 3;
    }

    if (batch.nhaiToContractorPaymentStatus === 'completed' && (userRole === 'admin' || userRole === 'Contractor')) {
      currentStep = 4;
    }

    return currentStep;
  };

  // Add console.log to debug
  useEffect(() => {
    console.log('Batch:', batch);
    console.log('Steps:', getSteps());
  }, [userRole, batch]);

  if (isLoading) {
    return <div>Loading tracker...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!batch) {
    return <div>Batch not found.</div>;
  }

  const steps = getSteps();
  const currentStep = getCurrentStep();

  return (
    <div className="tracker-page">
      <div className="tracker-container">
        <h2>Batch Progress Tracker for {batch.contractTitle}</h2>
        <div className="timeline">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${
                index < currentStep ? 'completed' : ''
              } ${index === currentStep - 1 ? 'active' : ''}`}
            >
              <div 
                className={`circle ${index < currentStep ? 'completed' : ''} ${
                  index === currentStep - 1 ? 'active' : ''
                }`}
              >
                {index + 1}
              </div>
              <div className="box">
                <h3>{step.heading}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tracker; 