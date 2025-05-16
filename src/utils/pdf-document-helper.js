/**
 * PDF Document Generator Helper Module
 * 
 * This module provides a unified interface for generating professional PDFs
 * for both invoices and estimates, replacing the existing implementation.
 */

import { generateProfessionalPdf } from './enhanced-pdf-generator';
import imageHolder from '@/helpers/logo.js';
import { getBase64FromUrl } from '@/helpers/index.js';
import { useToast } from 'vue-toast-notification';

/**
 * Generate PDF for an invoice or estimate
 * 
 * @param {Object} data - The invoice or estimate data
 * @param {Object} options - Configuration options
 * @param {string} options.type - 'invoice' or 'estimate'
 * @param {string} options.action - 'download' or 'whatsapp'
 * @param {string} options.filename - The filename for the PDF
 * @returns {Promise<Blob>} - A promise that resolves with the PDF blob
 */
export const generateDocument = async (data, options = {}) => {
  const toast = useToast();
  const {
    type = 'invoice',
    action = 'download',
    filename = `${type}-${data.number || data[`${type}_nr`] || Date.now()}.pdf`,
    profile = null, // Profile object with company info and logo URLs
  } = options;
  
  try {
    // Prepare logo image
    let logoImage = null;
    
    if (profile) {
      // Try to get the appropriate logo based on document type
      const logoUrl = type === 'invoice' 
        ? profile.invoice_logo || profile.estimate_logo || ''
        : profile.estimate_logo || profile.invoice_logo || '';
      
      if (logoUrl) {
        try {
          logoImage = await getBase64FromUrl(logoUrl);
        } catch (logoError) {
          console.warn('Error loading logo, using placeholder:', logoError);
          logoImage = imageHolder;
        }
      } else {
        logoImage = imageHolder;
      }
    } else {
      logoImage = imageHolder;
    }
    
    // Generate the PDF
    const pdfBlob = await generateProfessionalPdf(
      data,
      {
        type,
        action,
        filename,
        logoImage,
      }
    );
    
    // Show success message if downloading
    if (action === 'download') {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} downloaded successfully`);
    }
    
    return pdfBlob;
  } catch (error) {
    console.error(`Error generating ${type} PDF:`, error);
    toast.error(`Failed to generate ${type}. ${error.message}`);
    throw error;
  }
};

/**
 * Generate an invoice PDF
 * 
 * @param {Object} invoice - The invoice data
 * @param {Object} options - Configuration options
 * @returns {Promise<Blob>} - A promise that resolves with the PDF blob
 */
export const generateInvoice = async (invoice, options = {}) => {
  return generateDocument(invoice, { ...options, type: 'invoice' });
};

/**
 * Generate an estimate PDF
 * 
 * @param {Object} estimate - The estimate data
 * @param {Object} options - Configuration options
 * @returns {Promise<Blob>} - A promise that resolves with the PDF blob
 */
export const generateEstimate = async (estimate, options = {}) => {
  return generateDocument(estimate, { ...options, type: 'estimate' });
};