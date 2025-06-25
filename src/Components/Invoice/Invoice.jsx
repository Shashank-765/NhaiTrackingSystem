import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { FaRegFileAlt, FaUser, FaLink } from 'react-icons/fa';

const Invoice = ({ batch, onDownloadSuccess = () => {}, selectedMilestone: propSelectedMilestone }) => {
  const invoiceRef = useRef();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isContractor = user?.role?.toLowerCase() === 'contractor';
  
  // Filter milestones for contractor first
  let milestonesToShow = batch.milestones;
  if (isContractor) {
    let contractorName = user?.name;
    if (!contractorName && localStorage.getItem('user')) {
      try {
        contractorName = JSON.parse(localStorage.getItem('user')).name;
      } catch {}
    }
    milestonesToShow = batch.milestones?.filter(ms => ms.contractorName === contractorName);
  }
  
  // Filter milestones to show only completed work status
  milestonesToShow = milestonesToShow?.filter(ms => ms.workStatus === 'completed') || [];
  
  // If a specific milestone is provided and it's not in the filtered list, add it
  if (propSelectedMilestone && !milestonesToShow.find(ms => ms._id === propSelectedMilestone._id)) {
    milestonesToShow = [propSelectedMilestone, ...milestonesToShow];
  }
  
  // Calculate total bid value from milestones
  const totalBidValue = batch.milestones?.reduce((total, milestone) => {
    return total + (milestone.workStatus === 'completed' ? (milestone.amount || 0) : 0);
  }, 0) || 0;
  
  // Find the correct milestone index in the original batch
  const selectedMilestone = propSelectedMilestone || (milestonesToShow && milestonesToShow.length > 0 ? milestonesToShow[0] : batch.milestones[0]);
  const milestoneIndex = batch.milestones?.findIndex(m => m._id === selectedMilestone._id) || 0;
  let milestone = selectedMilestone;
  const adminDownloaded = milestone?.invoiceDownloads?.admin?.downloaded;
  const contractorDownloaded = milestone?.invoiceDownloads?.contractor?.downloaded;
  const adminDate = milestone?.invoiceDownloads?.admin?.date;
  const contractorDate = milestone?.invoiceDownloads?.contractor?.date;

  // Calculate late fee for contractor
  let lateDays = 0;
  let lateFeePercent = 0;
  let contractorAmount = 0;
  let lateFee = 0;
  let totalWithLateFee = 0;
  if (isContractor && adminDate && contractorDate) {
    const adminDateObj = new Date(adminDate);
    const contractorDateObj = new Date(contractorDate);
    // Calculate days difference (ignore time)
    lateDays = Math.floor((contractorDateObj.setHours(0,0,0,0) - adminDateObj.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    if (lateDays > 0) {
      lateFeePercent = Math.min(lateDays * 5, 10); // 5% per day, max 10%
    }
    // Sum contractor's milestone amounts
    contractorAmount = batch.milestones?.reduce((sum, ms) => {
      return sum + (ms.workStatus === 'completed' ? (ms.amount || 0) : 0);
    }, 0);
    lateFee = Math.round(contractorAmount * lateFeePercent / 100);
    totalWithLateFee = contractorAmount + lateFee;
  }

  const downloadInvoice = async () => {
    setIsGeneratingPDF(true);
    // Wait for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check if any milestone has completed and approved work
    const hasCompletedApprovedWork = batch.milestones?.some(milestone => 
      milestone.workStatus === 'completed' && milestone.workApproved
    );

    // Check if there are completed milestones
    if (!milestonesToShow || milestonesToShow.length === 0) {
      toast.error('No completed milestones available for invoice generation.', { autoClose: 3000 });
      setIsGeneratingPDF(false);
      return;
    }

    // Check payment status for admin
    if (isAdmin) {
      const lastNhaiPayment = milestone?.nhaiToContractor?.at(-1);
      if (!lastNhaiPayment || lastNhaiPayment.nhaiToContractorPaymentStatus !== "completed") {
        toast.error('Cannot download invoice. NHAI to contractor payment must be completed first.', { autoClose: 3000 });
        setIsGeneratingPDF(false);
        return;
      }
    }

    // Only proceed if allowed for contractor
    if (isContractor && !adminDownloaded) {
      toast.error('Admin must download invoice before you can download.', { autoClose: 1000 });
      setIsGeneratingPDF(false);
      return;
    }

    try {
      // Force body and html background to white for html2canvas
      const originalBodyBg = document.body.style.backgroundColor;
      const originalHtmlBg = document.documentElement.style.backgroundColor;
      document.body.style.backgroundColor = '#fff';
      document.documentElement.style.backgroundColor = '#fff';

      // Remove boxShadow and border from invoice container
      const element = invoiceRef.current;
      const originalBoxShadow = element.style.boxShadow;
      const originalBorder = element.style.border;
      element.style.boxShadow = 'none';
      element.style.border = 'none';
      element.style.backgroundColor = '#fff';

      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        removeContainer: true,
        backgroundColor: '#fff',
      });

      // Restore original background colors and styles
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
      element.style.boxShadow = originalBoxShadow;
      element.style.border = originalBorder;

      const data = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProperties = pdf.getImageProperties(data);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

      pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add completion date if available
      if (batch.completedAt) {
        pdf.setFontSize(10);
        pdf.text(`Completed on: ${new Date(batch.completedAt).toLocaleDateString()}`, 14, pdfHeight - 10);
      }

      pdf.save(`invoice-${batch.contractId}-${new Date().toISOString().split('T')[0]}.pdf`);

      // Track invoice download for all users
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/track-invoice-download`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user?.id,
            userRole: user?.role?.toLowerCase(),
            milestoneIndex
          })
        });
      } catch (error) {
        console.error('Error tracking invoice download:', error);
      }

      // Send notification about invoice download
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/notify-invoice-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            userId: user?.id,
            userRole: user?.role?.toLowerCase(),
            userName: user?.name,
            milestoneIndex
          })
        });
      } catch (error) {
        console.error('Error sending invoice download notification:', error);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/download-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          milestoneIndex,
        })
      });
      
      console.log('Sending milestoneIndex:', milestoneIndex, 'for milestone:', milestone.heading);
      
      let responseData;
      try {
        responseData = await res.json();
      } catch (e) {
        // If response is not JSON, handle gracefully
        setIsGeneratingPDF(false)
        toast.error('Server error: Invalid response', { autoClose: 1000 });
        return;
      }
      
      if (!res.ok || !responseData.success) {
        toast.error(responseData.message || 'Error downloading invoice', { autoClose: 3000 });
        setIsGeneratingPDF(false);
        return;
      }
      
      // Show success message with tax info if applicable
      if (responseData.data.taxApplied) {
        toast.success(`Invoice downloaded successfully. 5% tax applied due to delayed download.`, { autoClose: 3000 });
      } else {
      toast.success('Invoice downloaded successfully', { autoClose: 1000 });
      }
      
      setIsGeneratingPDF(false);

      if (onDownloadSuccess) {
        onDownloadSuccess();
      }
    } catch (error) {
      setIsGeneratingPDF(false)
      console.error('Error:', error.message);
      toast.error('Error generating invoice', { autoClose: 1000 });
    }
  };

  return (
    <>
    <div ref={invoiceRef} style={{...styles.container, backgroundColor: '#fff', boxShadow: 'none', border: 'none'}} className="invoice-pdf-bg">
      <div style={styles.headerContainer}>
        <h1 style={styles.heading}>INVOICE</h1>
        <div style={styles.blockchainDetails}>
          <div style={styles.blockchainDetailsHeader}>
            <FaLink style={styles.linkIcon} />
            <p style={styles.blockchainMainText}>Blockchain Details</p>
          </div>
          <p style={styles.blockchainSubText}>Ovalx2976</p>
          <p style={styles.blockchainSubText}>Block Number #7920</p>
          <p style={styles.blockchainSubText}>Timestamp 2925 05-11:30</p>
          <p style={styles.blockchainSubText}>Smart Contract NHAI Tradnetem</p>
          <p style={styles.blockchainSubText}>Verified On Hyperledger Fabric</p>
        </div>
      </div>
      <p style={styles.contractTitleTop}><FaRegFileAlt style={styles.inlineIcon} /> Contract Title<br/>{batch.contractTitle}</p>
      <div style={styles.invoiceDetails}>
        {/* Row 1 */}
        <div style={styles.detailItem}>
          <strong style={styles.bold}><FaRegFileAlt style={styles.inlineIcon} /> Contract Title</strong> {batch.contractTitle}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Agency Name</strong> {batch.agencyName}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Status</strong> {batch.status}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Date</strong> {new Date().toLocaleDateString()}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Contract ID:</strong> {batch.contractId}
        </div>
        {user?.role !== 'Contractor' && (
          <div style={styles.detailItem}>
            <strong style={styles.bold}>Bid Value:</strong> ₹{totalBidValue.toLocaleString()}
          </div>
        )}
      </div>
      {/* Milestone Table */}
      <div style={{ margin: '30px 0' }}>
        <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#1e3a8a' }}>Milestone Details</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>Heading</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>Contractor Name</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>Amount</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>Start Date</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>End Date</th>
              <th style={{ border: '1px solid #e0e0e0', padding: '8px' }}>Actual Amount</th>
            </tr>
          </thead>
          <tbody>
            {milestonesToShow && milestonesToShow.length > 0 ? (
              milestonesToShow.map((ms, idx) => {
                // Calculate actual amount for this milestone
                const actualAmount = ms.taxApplied ? ms.totalWithTax : ms.amount;
                const taxInfo = ms.taxApplied ? ` (incl. ${ms.taxPercentage}% tax)` : '';
                
                return (
              <tr key={idx}>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.heading}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.contractorName}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>₹{ms.amount?.toLocaleString()}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.startDate ? new Date(ms.startDate).toLocaleDateString() : '-'}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.endDate ? new Date(ms.endDate).toLocaleDateString() : '-'}</td>
                    <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>
                      <div>₹{actualAmount?.toLocaleString()}</div>
                      {ms.taxApplied && (
                        <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                          {taxInfo}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
                  No completed milestones available for invoice
                </td>
              </tr>
            )}
            {/* Late fee summary for contractor */}
            {isContractor && contractorAmount > 0 && (
              <>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Contractor Amount:</td>
                  <td colSpan={4} style={{ fontWeight: 'bold' }}>₹{contractorAmount.toLocaleString()}</td>
                </tr>
                {lateFee > 0 && (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'right', color: 'red', fontWeight: 'bold' }}>Late Fee ({lateFeePercent}% for {lateDays} day{lateDays > 1 ? 's' : ''}):</td>
                    <td colSpan={4} style={{ color: 'red', fontWeight: 'bold' }}>+ ₹{lateFee.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Amount Payable(after due date:- tax):</td>
                  <td colSpan={4} style={{ fontWeight: 'bold' }}>₹{totalWithLateFee > 0 ? totalWithLateFee.toLocaleString() : contractorAmount.toLocaleString()}</td>
                </tr>
              </>
            )}
            
            {/* Payment status information */}
            {isAdmin && (
              <tr>
                <td colSpan={6}>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ color: milestone?.nhaiToContractor?.at(-1)?.nhaiToContractorPaymentStatus === 'completed' ? 'green' : 'red' }}>
                      Payment Status: {milestone?.nhaiToContractor?.at(-1)?.nhaiToContractorPaymentStatus === 'completed' ? 'Completed' : 'Pending'}
                    </div>
                    {milestone?.nhaiToContractor?.at(-1)?.nhaiToContractorTransactionDate && (
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Payment Date: {new Date(milestone.nhaiToContractor.at(-1).nhaiToContractorTransactionDate).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ color: adminDownloaded ? 'green' : 'red' }}>
                      Admin downloaded: {adminDownloaded
                        ? (adminDate ? new Date(adminDate).toLocaleString() : 'Yes')
                        : 'Not yet'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            
            {isContractor && (
              isGeneratingPDF ? (
                <>
                  <tr>
                    <td colSpan={6}>
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div style={{ color: adminDownloaded ? 'green' : 'red' }}>
                          Admin downloaded: {adminDownloaded
                            ? (adminDate ? new Date(adminDate).toLocaleString() : 'Yes')
                            : 'Not yet'}
                        </div>
                        <div style={{ color: contractorDownloaded ? 'green' : 'red' }}>
                          Contractor downloaded: {contractorDownloaded
                            ? (contractorDate ? new Date(contractorDate).toLocaleString() : 'Yes')
                            : 'Not yet'}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {!adminDownloaded && (
                    <tr>
                      <td colSpan={6}>
                        <div style={{ color: 'red', textAlign: 'center' }}>
                          Admin must download invoice before you can download.
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div style={{ color: '#888', textAlign: 'center', fontStyle: 'italic' }}>
                    </div>
                  </td>
                </tr>
              )
            )}
            {/* Admin can see status in browser as before */}
            {isAdmin && !isContractor && (
              <tr>
                <td colSpan={6}>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ color: adminDownloaded ? 'green' : 'red' }}>
                      Admin downloaded: {adminDownloaded
                        ? (adminDate ? new Date(adminDate).toLocaleString() : 'Yes')
                        : 'Not yet'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={styles.footer}>
        <p style={styles.footerText}>Thank you for your business!</p>
      </div>
    </div>
      <button
        onClick={downloadInvoice}
        style={{
          ...styles.downloadButton,
          backgroundColor: (
            (isContractor && !adminDownloaded) || 
            (isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed"))
          ) ? '#cccccc' : '#4CAF50',
          cursor: (
            (isContractor && !adminDownloaded) || 
            (isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed"))
          ) ? 'not-allowed' : 'pointer',
          color: (
            (isContractor && !adminDownloaded) || 
            (isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed"))
          ) ? '#666666' : 'white'
        }}
        disabled={
          (isContractor && !adminDownloaded) || 
          (isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed")) ||
          (!milestonesToShow || milestonesToShow.length === 0)
        }
      >
        {!milestonesToShow || milestonesToShow.length === 0 
          ? "No Completed Milestones" 
          : isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed") 
            ? "Payment Not Completed" 
            : "Download Invoice"
        }
      </button>
      
      {/* Helper text for payment requirements */}
      {isAdmin && (!milestone?.nhaiToContractor?.at(-1) || milestone.nhaiToContractor.at(-1).nhaiToContractorPaymentStatus !== "completed") && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '10px' }}>
          ⚠️ NHAI to contractor payment must be completed before downloading invoice
        </div>
      )}
      
      {/* Helper text for no completed milestones */}
      {(!milestonesToShow || milestonesToShow.length === 0) && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '10px' }}>
          ⚠️ No completed milestones available for invoice generation
        </div>
      )}
      
      {/* Helper text for tax information */}
      {isAdmin && milestone?.nhaiToContractor?.at(-1)?.nhaiToContractorPaymentStatus === "completed" && milestonesToShow && milestonesToShow.length > 0 && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '10px' }}>
          Downloading on the same date as payment avoids 5% tax
        </div>
      )}
      
      {isContractor && !adminDownloaded && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginTop: '10px' }}>
        Admin must download invoice before contractor can access it
        </div>
      )}
    </>
  );
};

// Inline CSS styles
const styles = {
  container: {
    // maxWidth: '450px',
    margin: '20px auto',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    fontFamily: 'Arial, sans-serif',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '42px',
    color: '#2c3e50',
    fontWeight: 'bold',
    margin: '0',
    padding: '0',
  },
  contractTitleTop: {
    fontSize: '20px',
    color: '#333',
    marginBottom: '20px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    display: 'flex',
    alignItems: 'center',
  },
  blockchainDetails: {
    backgroundColor: '#e6ffe6',
    border: '1px solid #c8ecc8',
    borderRadius: '8px',
    padding: '10px 15px',
    fontSize: '12px',
    color: '#28a745',
    lineHeight: '1.4',
    maxWidth: '180px',
    textAlign: 'left',
  },
  blockchainDetailsHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px',
  },
  linkIcon: {
    marginRight: '5px',
    fontSize: '14px',
    color: '#28a745',
  },
  inlineIcon: {
    marginRight: '8px',
    color: '#555',
    fontSize: '18px',
  },
  blockchainMainText: {
    fontWeight: 'bold',
    margin: '0',
    padding: '0',
    fontSize: '13px',
    color: '#218838',
  },
  blockchainSubText: {
    margin: '0',
    padding: '0',
    fontSize: '11px',
    color: '#333',
  },
  invoiceDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px 20px',
    margin: '20px 0',
    padding: '0',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
    paddingTop: '20px',
    paddingBottom: '20px',
  },
  detailItem: {
    fontSize: '16px',
    color: '#555',
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
  },
  detailItemColumn2: {
    fontSize: '16px',
    color: '#555',
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'nowrap',
    alignItems: 'flex-start',
  },
  bold: {
    fontWeight: 'normal',
    color: '#333',
    marginBottom: '4px',
  },
  approvedTag: {
    backgroundColor: '#e6ffe6',
    color: '#28a745',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    marginBottom: '5px',
    border: '1px solid #c8ecc8',
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '16px',
    color: '#777',
  },
  downloadButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
    display: 'block',
    margin: '20px auto'
  }
};

export default Invoice;
