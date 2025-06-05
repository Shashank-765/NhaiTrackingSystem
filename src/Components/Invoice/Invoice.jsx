import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Invoice = ({ batch }) => {
  const invoiceRef = useRef();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isContractor = user?.role?.toLowerCase() === 'contractor';
  const downloadInvoice = async () => {
    if (batch.workStatus !== 'completed' || !batch.workApproved) {
      toast.warning('Invoice can only be downloaded for completed and approved work',{
        autoClose: 1000,
      });
      return;
    }else if(isContractor && !batch.adminInvoiceDownloaded){
      toast.warning('Please wait for admin to download the invoice first',{autoClose: 1000});
      return;
    } else if(isAdmin){
      batch.adminInvoiceDownloaded=true;
    }
    // If admin, check if contractor has downloaded first
    // if (isAdmin && !batch.invoiceDownloaded) {
    //   toast.warning('Please wait for contractor to download the invoice first',{
    //     autoClose: 1000,
    //   });
    //   return;
    // }

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 1,
        useCORS: true,
        logging: false,
        removeContainer: true
      });
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
        await fetch(`${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/track-invoice-download`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        // Send notification to admin about invoice download
        await fetch(`${import.meta.env.VITE_API_URL}/api/${import.meta.env.VITE_API_VERSION}/batches/${batch._id}/notify-invoice-download`, {
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

  return (
    <>
    
    <div ref={invoiceRef} style={styles.container}>
      <h1 style={styles.heading}>Invoice</h1>
      <div style={styles.invoiceDetails}>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Contract Title:</strong> {batch.contractTitle}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Contract ID:</strong> {batch.contractId}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Bid Value:</strong> ₹{batch.bidValue.toLocaleString()}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Bid Duration:</strong> {batch.bidDuration}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Agency Name:</strong> {batch.agencyName}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Contractor Name:</strong> {batch.contractorName}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Status:</strong> {batch.status}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Work Status:</strong> {batch.workStatus}
        </div>
        <div style={styles.detailItem}>
          <strong style={styles.bold}>Date:</strong> {new Date().toLocaleDateString()}
        </div>
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
    maxWidth: '450px',
    margin: '20px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f9f9f9',
  },
  heading: {
    textAlign: 'center',
    fontSize: '32px',
    color: '#333',
    marginBottom: '20px',
  },
  invoiceDetails: {
    margin: '20px 0',
    paddingLeft: '20px',
  },
  detailItem: {
    fontSize: '18px',
    marginBottom: '10px',
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #ccc',
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
