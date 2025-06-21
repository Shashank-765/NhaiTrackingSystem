import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { FaRegFileAlt, FaUser, FaLink } from 'react-icons/fa';

const Invoice = ({ batch }) => {
  const invoiceRef = useRef();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isContractor = user?.role?.toLowerCase() === 'contractor';
  
  // Calculate total bid value from milestones
  const totalBidValue = batch.milestones?.reduce((total, milestone) => {
    return total + (milestone.amount || 0);
  }, 0) || 0;
  
  const downloadInvoice = async () => {
    // Check if any milestone has completed and approved work
    const hasCompletedApprovedWork = batch.milestones?.some(milestone => 
      milestone.workStatus === 'completed' && milestone.workApproved
    );

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

      // Only update invoice status and notify admin when contractor downloads
      if (isAdmin) {
        // Track invoice download
        await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/track-invoice-download`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Send notification to admin about invoice download
        await fetch(`${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/notify-invoice-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      toast.success('Invoice downloaded successfully',{autoClose: 1000});
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error generating invoice. Please try again.',{autoClose: 1000});
    }
  };

  // Filter milestones for contractor
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
            </tr>
          </thead>
          <tbody>
            {milestonesToShow && milestonesToShow.map((ms, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.heading}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.contractorName}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>₹{ms.amount?.toLocaleString()}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.startDate ? new Date(ms.startDate).toLocaleDateString() : '-'}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: '8px' }}>{ms.endDate ? new Date(ms.endDate).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={styles.footer}>
        <p style={styles.footerText}>Thank you for your business!</p>
      </div>
    </div>
      <button onClick={downloadInvoice} style={styles.downloadButton}>
        Download Invoice
      </button>
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
