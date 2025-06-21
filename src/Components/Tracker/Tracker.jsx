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
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role);
  }, []);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/${
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
      },
      {
        heading: `Agency: ${batch.agencyName}`,
        description: `Agency to Admin Payment Status: ${batch.agencyToNhaiPaymentStatus || 'pending'}${
          batch.agencyToNhaiTransactionId ? '\nTransaction ID: ' + batch.agencyToNhaiTransactionId : ''
        }${
          batch.agencyToNhaiTransactionDate ? '\nDate: ' + new Date(batch.agencyToNhaiTransactionDate).toLocaleDateString() : ''
        }`,
        visibleTo: ['admin', 'Agency']
      }
    ];

    // For admin, show all contractors and their milestones
    if (userRole === 'admin') {
      // Group milestones by contractor
      const contractorMilestones = {};
      batch.milestones?.forEach(milestone => {
        if (!contractorMilestones[milestone.contractorId]) {
          contractorMilestones[milestone.contractorId] = {
            contractorName: milestone.contractorName,
            milestones: []
          };
        }
        contractorMilestones[milestone.contractorId].milestones.push(milestone);
      });

      // Add steps for each contractor
      Object.entries(contractorMilestones).forEach(([contractorId, data]) => {
        baseSteps.push({
          heading: `Contractor: ${data.contractorName}`,
          description: 'Milestones:',
          visibleTo: ['admin'],
          milestoneRef: data.milestones[0]
        });

        // Add milestones and their payment info for this contractor
        data.milestones.forEach((milestone, index) => {
          // Add milestone
          baseSteps.push({
            heading: `Milestone ${index + 1}`,
            description: `
              Heading: ${milestone.heading}
              Amount: ₹${milestone.amount}
              Start Date: ${new Date(milestone.startDate).toLocaleDateString()}
              End Date: ${new Date(milestone.endDate).toLocaleDateString()}
              Status: ${milestone.status}
            `,
            visibleTo: ['admin'],
            milestoneRef: milestone
          });

          // Add payment info for this milestone
          baseSteps.push({
            heading: `Payment for Milestone ${index + 1}`,
            description: `
              Amount: ₹${milestone.amount}
              Status: ${milestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus || 'pending'}
              ${milestone.nhaiToContractor?.[0]?.nhaiToContractorTransactionId ? `Transaction ID: ${milestone.nhaiToContractor[0].nhaiToContractorTransactionId}` : ''}
              ${milestone.nhaiToContractor?.[0]?.nhaiToContractorTransactionDate ? `Date: ${new Date(milestone.nhaiToContractor[0].nhaiToContractorTransactionDate).toLocaleDateString()}` : ''}
            `,
            visibleTo: ['admin'],
            milestoneRef: milestone,
            isPaymentStep: true
          });
        });
      });
    } else if (userRole === 'Contractor') {
      // For contractor role, show all their milestones for this contract
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
      const userMilestones = batch.milestones?.filter(
        milestone => milestone.contractorId === currentUserId
      ) || [];

      console.log('Contractor milestones:', {
        currentUserId,
        totalMilestones: batch.milestones?.length,
        userMilestones: userMilestones.length,
        milestones: userMilestones.map(m => ({ heading: m.heading, contractorId: m.contractorId }))
      });

      // Add contractor summary
      baseSteps.push({
        heading: `Your Contract Summary`,
        description: `
          Contract: ${batch.contractTitle}
          Total Milestones: ${userMilestones.length}
          Total Amount: ₹${userMilestones.reduce((sum, m) => sum + (m.amount || 0), 0)}
        `,
        visibleTo: ['Contractor'],
        milestoneRef: userMilestones[0]
      });

      userMilestones.forEach((milestone, index) => {
        // Add milestone
        baseSteps.push({
          heading: `Milestone ${index + 1}`,
          description: `
            Heading: ${milestone.heading}
            Amount: ₹${milestone.amount}
            Start Date: ${new Date(milestone.startDate).toLocaleDateString()}
            End Date: ${new Date(milestone.endDate).toLocaleDateString()}
            Status: ${milestone.status}
            Work Status: ${milestone.workStatus || 'pending'}
            Work Approved: ${milestone.workApproved ? 'Yes' : 'No'}
          `,
          visibleTo: ['Contractor'],
          milestoneRef: milestone
        });

        // Add payment info for this milestone
        baseSteps.push({
          heading: `Payment for Milestone ${index + 1}`,
          description: `
            Status: ${milestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus || 'pending'}
          
          `,
          visibleTo: ['Contractor'],
          milestoneRef: milestone,
          isPaymentStep: true
        });
      });
    } else {
      // For Agency role, show milestones for this contract
      if (userRole === 'Agency') {
        // Agency sees all milestones for this contract
        const agencyMilestones = batch.milestones || [];

        console.log('Agency milestones:', {
          totalMilestones: batch.milestones?.length,
          agencyMilestones: agencyMilestones.length,
          milestones: agencyMilestones.map(m => ({ heading: m.heading, contractorName: m.contractorName }))
        });

        // Add agency summary
        baseSteps.push({
          heading: `Agency Contract Summary`,
          description: `
            Contract: ${batch.contractTitle}
            Total Milestones: ${agencyMilestones.length}
            Total Amount: ₹${agencyMilestones.reduce((sum, m) => sum + (m.bidAmount || 0), 0)}
          `,
          visibleTo: ['Agency'],
          milestoneRef: agencyMilestones[0]
        });

        agencyMilestones.forEach((milestone, index) => {
          // Add milestone
          baseSteps.push({
            heading: `Milestone ${index + 1}`,
            description: `
              Heading: ${milestone.heading}
              Contractor: ${milestone.contractorName}
              Bid Amount: ₹${milestone.bidAmount}
              Start Date: ${new Date(milestone.startDate).toLocaleDateString()}
              End Date: ${new Date(milestone.endDate).toLocaleDateString()}
              Status: ${milestone.status}
              Work Status: ${milestone.workStatus || 'pending'}
              Work Approved: ${milestone.workApproved ? 'Yes' : 'No'}
            `,
            visibleTo: ['Agency'],
            milestoneRef: milestone
          });

          // Add payment info for this milestone
          baseSteps.push({
            heading: `Payment for Milestone ${index + 1}`,
            description: `
              Status: ${milestone.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus || 'pending'}
              ${milestone.agencytoNhai?.[0]?.agencytoNhaiTransactionId ? `Transaction ID: ${milestone.agencytoNhai[0].agencytoNhaiTransactionId}` : ''}
              ${milestone.agencytoNhai?.[0]?.agencytoNhaiTransactionDate ? `Date: ${new Date(milestone.agencytoNhai[0].agencytoNhaiTransactionDate).toLocaleDateString()}` : ''}
            `,
            visibleTo: ['Agency'],
            milestoneRef: milestone,
            isPaymentStep: true
          });
        });
      }
    }

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

    // Check if agency payment is completed
    if (batch.agencyToNhaiPaymentStatus === 'completed') {
      currentStep = 2;
    }

    // For admin, check if any contractor milestones are completed
    if (userRole === 'admin') {
      const hasCompletedMilestones = batch.milestones?.some(milestone => 
        milestone.workStatus === 'completed' && milestone.workApproved
      );
      if (hasCompletedMilestones) {
        currentStep = 3;
      }

      // Check if any payments are completed
      const hasCompletedPayments = batch.milestones?.some(milestone => 
        milestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed'
      );
      if (hasCompletedPayments) {
        currentStep = 4;
      }
    } else if (userRole === 'Contractor') {
      // For contractor, check their own milestones using current user ID
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
      const contractorMilestones = batch.milestones?.filter(
        milestone => milestone.contractorId === currentUserId
      ) || [];

      const hasCompletedWork = contractorMilestones.some(milestone => 
        milestone.workStatus === 'completed' && milestone.workApproved
      );
      if (hasCompletedWork) {
        currentStep = 3;
      }

      const hasCompletedPayment = contractorMilestones.some(milestone => 
        milestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed'
      );
      if (hasCompletedPayment) {
        currentStep = 4;
      }
    } else if (userRole === 'Agency') {
      // For agency, check their milestones
      const agencyMilestones = batch.milestones || [];

      const hasCompletedWork = agencyMilestones.some(milestone => 
        milestone.workStatus === 'completed' && milestone.workApproved
      );
      if (hasCompletedWork) {
        currentStep = 3;
      }

      const hasCompletedPayment = agencyMilestones.some(milestone => 
        milestone.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === 'completed'
      );
      if (hasCompletedPayment) {
        currentStep = 4;
      }
    }

    return currentStep;
  };

  const getStepStatus = (stepIndex) => {
    if (!batch) return { isCompleted: false, isActive: false };

    const steps = getSteps();
    const currentStep = getCurrentStep();
    if (stepIndex === 0) {
      return { isCompleted: true, isActive: false };
    }

    // Agency payment step
    if (stepIndex === 1) {
      const isCompleted = batch.agencyToNhaiPaymentStatus === 'completed';
      const isActive = !isCompleted && currentStep > 1;
      return { isCompleted, isActive };
    }

    // For admin view
    if (userRole === 'admin') {
      const step = steps[stepIndex];
      if (step && step.milestoneRef) {
        if (step.isPaymentStep) {
          const isCompleted = step.milestoneRef.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed';
          return { isCompleted, isActive: false };
        } else {
          const isCompleted = step.milestoneRef.workStatus === 'completed' && step.milestoneRef.workApproved;
          return { isCompleted, isActive: false };
        }
      }
    } else if (userRole === 'Contractor') {
      const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
      const contractorMilestones = batch.milestones?.filter(
        milestone => milestone.contractorId === currentUserId
      ) || [];

      // Step 2 is contractor summary (always completed if we have milestones)
      if (stepIndex === 2) {
        return { isCompleted: contractorMilestones.length > 0, isActive: false };
      }

      // Contractor milestones start from step 3 (after admin, agency, and summary)
      if (stepIndex >= 3) {
        const milestoneIndex = Math.floor((stepIndex - 3) / 2); // Every 2 steps = 1 milestone
        const isPaymentStep = (stepIndex - 3) % 2 === 1; // Odd steps are payment steps
        
        if (milestoneIndex < contractorMilestones.length) {
          const milestone = contractorMilestones[milestoneIndex];
          
          if (isPaymentStep) {
            // Payment step
            const isCompleted = milestone.nhaiToContractor?.[0]?.nhaiToContractorPaymentStatus === 'completed';
            return { isCompleted, isActive: false };
          } else {
            // Work step
            const isCompleted = milestone.workStatus === 'completed' && milestone.workApproved;
            return { isCompleted, isActive: false };
          }
        }
      }
    } else if (userRole === 'Agency') {
      // For agency, check their milestones
      const agencyMilestones = batch.milestones || [];

      // Step 2 is agency summary (always completed if we have milestones)
      if (stepIndex === 2) {
        return { isCompleted: agencyMilestones.length > 0, isActive: false };
      }

      // Agency milestones start from step 3 (after admin, agency payment, and summary)
      if (stepIndex >= 3) {
        const milestoneIndex = Math.floor((stepIndex - 3) / 2); // Every 2 steps = 1 milestone
        const isPaymentStep = (stepIndex - 3) % 2 === 1; // Odd steps are payment steps
        
        if (milestoneIndex < agencyMilestones.length) {
          const milestone = agencyMilestones[milestoneIndex];
          
          if (isPaymentStep) {
            // Payment step
            const isCompleted = milestone.agencytoNhai?.[0]?.agencytoNhaiPaymentStatus === 'completed';
            return { isCompleted, isActive: false };
          } else {
            // Work step
            const isCompleted = milestone.workStatus === 'completed' && milestone.workApproved;
            return { isCompleted, isActive: false };
          }
        }
      }
    }

    return { isCompleted: false, isActive: false };
  };

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
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div 
                key={index} 
                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${status.isCompleted ? 'completed' : ''} ${index === currentStep - 1 ? 'active' : ''}`}
              >
                <div 
                  className={`circle ${status.isCompleted ? 'completed' : ''} ${status.isActive ? 'active' : ''}`}
                >
                  {index + 1}
                </div>
                <div className="box">
                  <h3>{step.heading}</h3>
                  <p style={{ whiteSpace: 'pre-line' }}>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tracker; 