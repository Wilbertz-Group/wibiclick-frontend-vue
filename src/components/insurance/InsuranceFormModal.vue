<!-- wibiclick-frontend-vue/src/components/insurance/InsuranceFormModal.vue -->
<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import  useUserStore  from "@/stores/UserStore";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import TipTapEditor from '@/components/editor/TipTapEditor.vue'; // Import TipTapEditor
import modal from "@/components/misc/modalWAMessage.vue";
import imageHolder from '@/helpers/logo.js';
import { getBase64FromUrl } from '@/helpers/index.js'; // Assuming this exists in helpers

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // To link report to customer
    type: Object,
    default: () => ({}),
  },
  insuranceData: { // For editing existing report
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'insurance-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);

const profile = ref(null); // Add profile state
const save_type = ref('save'); // 'save', 'download', 'whatsapp'
const isOpen = ref(false); // WhatsApp modal state
const blob = ref(null); // PDF blob for WhatsApp
const client = ref('');
const sender = ref('');
const company = ref('');
// --- Form State ---
const insuranceForm = reactive({
  id: '', // Will be empty for new reports
  customerId: '',
  number: '', // Report number
  status: 'pending', // Default status
  report_date: moment().format('YYYY-MM-DD'), // Date of report creation/update
  notes: '', // Changed from details to notes
  // Add other relevant fields like provider, policy_no, claim_no etc. if needed
});

// Match statuses from Insurance.vue and old Edit.vue
const INSURANCE_STATUSES = ['pending', 'processing', 'paid', 'accepted', 'sent', 'rejected']; // Added rejected

const isEditing = computed(() => !!insuranceForm.id);

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetInsuranceForm = () => {
  Object.assign(insuranceForm, {
    id: '',
    customerId: '',
    number: '',
    status: 'pending',
    report_date: moment().format('YYYY-MM-DD'),
    notes: '', // Changed from details
  });
};

const prefillForm = (customer) => {
  resetInsuranceForm();

  if (customer && customer.id) {
    insuranceForm.customerId = customer.id;
  }

  // If editing, populate with existing insurance data
  if (props.insuranceData) {
    Object.assign(insuranceForm, {
      id: props.insuranceData.id,
      customerId: props.insuranceData.customerId || (customer && customer.id) || '',
      number: props.insuranceData.number || '',
      status: props.insuranceData.status || 'pending',
      // Use issuedAt from old data if available, otherwise createdAt, otherwise now
      report_date: props.insuranceData.issuedAt ? moment(props.insuranceData.issuedAt).format('YYYY-MM-DD') : (props.insuranceData.createdAt ? moment(props.insuranceData.createdAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')),
      notes: props.insuranceData.notes || props.insuranceData.details || '', // Use notes first, fallback to details
    });
  } else {
      // Fetch and set the next report number for new reports
      fetchNextReportNumber().then(nextNumber => {
        if (nextNumber !== null) {
          insuranceForm.number = nextNumber.toString();
        }
      });
  }
};

// Function to get the next report number
async function fetchNextReportNumber() {
  if (!userStore.currentWebsite) return null; // Need website context
  loading.value = true;
  try {
    const response = await axios.get(`/insurance_report_number?id=${userStore.currentWebsite}`);
    const lastNumber = response.data?.insurance_number || 0;
    return Number(lastNumber) + 1; // Return the next number
  } catch (error) {
    // Removed console.error
    toast.error("Could not fetch the next report number.");
    return null; // Indicate failure
  } finally {
    loading.value = false;
  }
}

const saveInsuranceOnly = async (closeAfterSave = true) => { // Renamed and added parameter
  loading.value = true;
  try {
    // Construct payload similar to old Edit.vue
    const payload = {
      id: isEditing.value ? insuranceForm.id : undefined, // Include ID only if editing
      number: insuranceForm.number,
      status: insuranceForm.status,
      customerId: insuranceForm.customerId,
      notes: insuranceForm.notes, // Use notes instead of details
      issuedAt: moment(insuranceForm.report_date).toISOString(), // Send date as issuedAt
      name: 'Insurance Report', // Default name as in old Edit.vue
      employeeId: props.insuranceData?.employeeId || userStore.user?.id || '', // Get from existing data or current user
      websiteId: props.insuranceData?.websiteId || userStore.currentWebsite || '', // Get from existing data or current website
      items: props.insuranceData?.items || [], // Get from existing data or default to empty array
    };

    // Use POST for both add and update, matching old Edit.vue
    const endpoint = `add-insurance-report?id=${userStore.currentWebsite}`;
    const method = 'post';
    
    const response = await axios({ method, url: endpoint, data: payload });
    toast.success(response.data.message || 'Insurance report saved successfully');
    emit('insurance-saved');
    if (closeAfterSave) {
      closeModal();
    }
    return true; // Indicate success
  } catch (error) {
    // Removed console.error
    toast.error(`Error submitting report: ${error.response?.data?.message || error.message}`);
    return false; // Indicate failure
  } finally {
    loading.value = false;
  }
};
const saveAndDownloadInsurance = async () => {
  // First, save the report data without closing the modal
  const savedSuccessfully = await saveInsuranceOnly(false); 

  if (savedSuccessfully) {
    // If save was successful, prepare and download the PDF
    if (!profile.value) {
      toast.warning("Company profile not loaded yet. Please wait.");
      await fetchProfile();
    }
    if (profile.value) {
       prepareAndGeneratePDF(insuranceForm, `InsuranceReport_${insuranceForm.number || 'Details'}.pdf`, 'download');
       closeModal(); // Close modal after download starts
    } else {
      toast.error("Could not load profile data to generate PDF.");
    }
  } else {
    toast.error("Failed to save report, cannot download PDF.");
  }
};

const handleSave = () => {
  if (save_type.value === 'save') {
    saveInsuranceOnly();
  } else if (save_type.value === 'download') {
    saveAndDownloadInsurance();
  }
  // WhatsApp is handled by a separate button/function (sendAttachment)
};


const fetchProfile = async () => {
  // Fetch profile if not already loaded (needed for company details in PDF)
  if (profile.value) return;
  try {
    loading.value = true;
    const response = await axios.get('profile?id=' + userStore.currentWebsite);
    profile.value = response.data;
    loading.value = false;
  } catch (error) {
    // Removed console.error
    toast.warning("Failed to get profile data for PDF generation.");
    loading.value = false;
  }
};

// --- PDF Generation & WhatsApp --- 

const closeModalWA = () => {
  isOpen.value = false;
};

// Simplified PDF generation for Insurance Reports
const createInsurancePDF = (report, path, action = 'download') => {
  let doc;
  if (!window.PDFDocument || !window.blobStream) {
      toast.error("PDF generation library not loaded yet. Please wait and try again.");
      // Removed console.error
      return;
  }
  try {
    doc = new window.PDFDocument({ size: "A4", margin: 50 });
  } catch (error) {
    // Removed console.error
    toast.error("Failed to initialize PDF generation.");
    return;
  }
  
  // Set a global error handler for the PDF generation process
  const originalConsoleError = console.error;
  console.error = function(message, ...args) {
    // Log the error but don't let it stop the PDF generation
    originalConsoleError.apply(console, [message, ...args]);
    if (message.includes("NaN") || message.includes("undefined")) {
      toast.warning("Some formatting may be simplified in the PDF due to complex content");
    }
  };

  const stream = doc.pipe(window.blobStream());

  // --- PDF Content Generation Functions ---
  function generateHeader(doc, report) {
    const companyDetails = profile.value?.company || {};
    doc
      .image(img, 50, 45, { width: 50 }) // Assumes 'img' is loaded globally
      .fillColor("#444444")
      .fontSize(14)
      .text(companyDetails.name || '', 110, 57)
      .fontSize(10)
      .text(companyDetails.slogan || '', 110, 75)
      .text(companyDetails.name || '', 200, 50, { align: "right" })
      .text(companyDetails.address1 || '', 200, 65, { align: "right" })
      .text(`${companyDetails.address2 || ''} ${companyDetails.city || ''}`, 200, 80, { align: "right" })
      .text(`${companyDetails.state || ''}, ${companyDetails.country || ''}`, 200, 95, { align: "right" })
      .text(companyDetails.postal_code || '', 200, 110, { align: "right" })
      .text(`Email: ${companyDetails.email || ''}`, 200, 130, { align: "right" })
      .moveDown();
  }

  function generateReportDetails(doc, report) {
    doc.fillColor("#444444").fontSize(20).text("Insurance Report", 50, 160);
    generateHr(doc, 185);
    const detailsTop = 200;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Report Details:", 50, detailsTop)
      .font("Helvetica")
      .text("Report #:", 50, detailsTop + 15)
      .text(report.number || 'N/A', 150, detailsTop + 15)
      .text("Report Date:", 50, detailsTop + 30)
      .text(report.report_date || 'N/A', 150, detailsTop + 30)
      .text("Status:", 50, detailsTop + 45)
      .text(report.status || 'N/A', 150, detailsTop + 45);

    // Customer Info
    doc
      .font("Helvetica-Bold")
      .text("Customer Details:", 300, detailsTop)
      .font("Helvetica")
      .text("Name:", 300, detailsTop + 15)
      .text(props.customerData?.name || 'N/A', 350, detailsTop + 15)
      .text("Phone:", 300, detailsTop + 30)
      .text(props.customerData?.phone || 'N/A', 350, detailsTop + 30)
      .text("Address:", 300, detailsTop + 45)
      .text(props.customerData?.address || 'N/A', 350, detailsTop + 45, { width: 230 }); // Added width for address

    generateHr(doc, detailsTop + 80);
  }

 // This function parses HTML content from TipTap editor and preserves formatting in the PDF
 // It handles headings, paragraphs, lists, text formatting, and other rich text elements
 function generateNotes(doc, report) {
    doc.moveDown(2);
    if (report.notes) {
        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Details / Notes:", 50)
            .moveDown(0.6)
            .fontSize(10)
            .font("Helvetica");

        // Improved HTML content handling to preserve formatting from TipTap editor
        // This parses the HTML and maintains headings, paragraphs, lists, and text formatting in the PDF
        const content = report.notes;
        
        // Parse the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Process the content with formatting preserved
        try {
            const processNode = (node, indent = 0) => {
                // Ensure indent is always a valid number
                indent = Number(indent) || 0;
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    doc.text(text, 50 + indent, { continued: false, width: 500 - indent });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Handle different element types
                switch (node.nodeName.toLowerCase()) {
                    case 'h1':
                        doc.moveDown(0.6).fontSize(16).font('Helvetica-Bold');
                        processTextContent(node, indent);
                        doc.fontSize(10).font('Helvetica').moveDown(0.6); // Adjusted moveDown
                        break;
                    case 'h2':
                        doc.moveDown(0.6).fontSize(14).font('Helvetica-Bold');
                        processTextContent(node, indent);
                        doc.fontSize(10).font('Helvetica').moveDown(0.6); // Adjusted moveDown
                        break;
                    case 'h3':
                        doc.moveDown(0.6).fontSize(12).font('Helvetica-Bold');
                        processTextContent(node, indent);
                        doc.fontSize(10).font('Helvetica').moveDown(0.6); // Adjusted moveDown
                        break;
                    case 'p':
                        doc.moveDown(0.6);
                        processTextContent(node, indent);
                        doc.moveDown(0.6); // Adjusted moveDown
                        break;
                    case 'br':
                        doc.moveDown(0.6);
                        break;
                    case 'strong':
                    case 'b':
                        doc.font('Helvetica-Bold');
                        processTextContent(node, indent);
                        doc.font('Helvetica');
                        break;
                    case 'em':
                    case 'i':
                        doc.font('Helvetica-Oblique');
                        processTextContent(node, indent);
                        doc.font('Helvetica');
                        break;
                    case 'ul':
                        doc.moveDown(0.6);
                        Array.from(node.childNodes).forEach(child => {
                            if (child.nodeName.toLowerCase() === 'li') {
                                try {
                                    // Ensure indent is a valid number before calculating xPos
                                    const currentIndent = Number(indent) || 0;
                                    const xPos = Math.max(50, 50 + currentIndent);
                                    const yPos = doc.y; // Get current Y position
                                    // Explicitly set Y position to avoid potential NaN issues
                                    if (isNaN(yPos)) {
                                        // Attempt a fallback if yPos is NaN (shouldn't happen often)
                                        doc.text('• ', xPos, { continued: true });
                                    } else {
                                        doc.text('• ', xPos, yPos, { continued: true });
                                    }
                                    processTextContent(child, currentIndent + 10);
                                } catch (err) {
                                    // Removed console.error
                                    // Fallback to basic bullet point
                                    doc.text('• ' + child.textContent.trim());
                                }
                                doc.moveDown(1); // Reverted spacing after bullet item
                            }
                        });
                        doc.moveDown(0.6);
                        break;
                    case 'ol':
                        doc.moveDown(0.6);
                        let itemNumber = 1;
                        Array.from(node.childNodes).forEach(child => {
                            if (child.nodeName.toLowerCase() === 'li') {
                                try {
                                    // Ensure indent is a valid number before calculating xPos
                                    const currentIndent = Number(indent) || 0;
                                    const xPos = Math.max(50, 50 + currentIndent);
                                    // Explicitly set Y position (similar logic could be added if needed)
                                    doc.text(`${itemNumber}. `, xPos, { continued: true });
                                    processTextContent(child, currentIndent + 15);
                                } catch (err) {
                                    // Removed console.error
                                    // Fallback to basic numbered list item
                                    doc.text(`${itemNumber}. ` + child.textContent.trim());
                                }
                                doc.moveDown(0.6); // Reverted spacing after numbered item
                                itemNumber++;
                            }
                        });
                        doc.moveDown(0.6);
                        break;
                    case 'blockquote':
                        doc.moveDown(0.6);
                        try {
                            // Ensure indent is a valid number before calculating xPos
                            const currentIndent = Number(indent) || 0;
                            const xPos = Math.max(70, 70 + currentIndent);
                            // Explicitly set Y position (similar logic could be added if needed)
                            doc.text('', xPos, { continued: false });
                            processTextContent(node, currentIndent + 20);
                        } catch (err) {
                            // Removed console.error
                            // Fallback to basic blockquote
                            doc.text(node.textContent.trim());
                        }
                        doc.moveDown(0.6);
                        break;
                    case 'pre':
                    case 'code':
                        doc.moveDown(0.6).font('Courier');
                        processTextContent(node, indent + 10);
                        doc.font('Helvetica').moveDown(0.6);
                        break;
                    default:
                        // Process child nodes for other elements
                        Array.from(node.childNodes).forEach(child => {
                            processNode(child, indent);
                        });
                }
            }
        };
        
        // Helper function to process text content of a node, handling inline styles (Simplified)
        const processTextContent = (node, indent) => {
            // Ensure indent is always a valid number
            indent = Number(indent) || 0;
            const startX = 50 + indent;

            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    // Render text node with current font, allow continuation
                     doc.text(child.textContent, { continued: true, width: 500 - indent });
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const originalFont = doc._font.name; // Store current font
                    let renderText = child.textContent; // Text to render for this element

                    try {
                        switch (child.nodeName.toLowerCase()) {
                            case 'strong':
                            case 'b':
                                doc.font('Helvetica-Bold');
                                doc.text(renderText, { continued: true, width: 500 - indent });
                                doc.font(originalFont); // Restore font
                                break;
                            case 'em':
                            case 'i':
                                doc.font('Helvetica-Oblique');
                                doc.text(renderText, { continued: true, width: 500 - indent });
                                doc.font(originalFont); // Restore font
                                break;
                            // Add cases for other inline styles like 'u' (underline) if needed
                            // case 'u':
                            //     doc.text(renderText, { continued: true, underline: true, width: 500 - indent });
                            //     break;
                            default:
                                // Render text content of unknown/unhandled inline elements
                                doc.text(renderText, { continued: true, width: 500 - indent });
                        }
                    } catch (err) {
                         // Removed console.error
                         // Fallback: render plain text and restore font
                         doc.font(originalFont);
                         doc.text(renderText, { continued: true });
                    }
                }
            });
             // After processing all children of the block node (e.g., <p>), add a final newline.
             // This prevents text from the *next* block element from continuing on the same line.
             doc.text('', startX); // Move to next line
        };
        
        // Start processing from the root
        Array.from(tempDiv.childNodes).forEach(node => {
            processNode(node);
        });
        } catch (error) {
            // Removed console.error
            // Fallback to basic text rendering if HTML processing fails
            doc.text(report.notes.replace(/<[^>]+>/g, ''), {
                align: "left",
                width: 500
            });
        }
    }
}


  function generateFooter(doc) {
    // Optional: Add a footer if needed
    // doc.fontSize(10).text("Generated by Wibiclick", 50, 780, { align: "center", width: 500 });
  }

  function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  }
  // --- End PDF Content Generation Functions ---

  // Add content to the document
  try {
    generateHeader(doc, report);
    generateReportDetails(doc, report);
    generateNotes(doc, report);
    generateFooter(doc);
  } catch (error) {
    // Removed console.error
    // Add a simple error message to the PDF
    doc.fontSize(14).font('Helvetica-Bold').text('Error generating formatted content', 50, 300);
    doc.fontSize(10).font('Helvetica').text('The report content could not be fully formatted. Please try again or contact support.', 50, 330);
  }

  doc.end();

  stream.on("finish", function() {
    // Restore the original console.error function
    console.error = originalConsoleError;
    const pdfBlob = stream.toBlob("application/pdf");
    if (action === 'download') {
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      const url = window.URL.createObjectURL(pdfBlob);
      a.href = url;
      a.download = path;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Insurance Report with formatting downloaded successfully");
    } else if (action === 'whatsapp') {
      blob.value = pdfBlob;
      isOpen.value = true;
    }
  });
};

let img; // Variable to hold the logo image dataURL

const prepareAndGeneratePDF = async (report, path, action = 'download') => {
  loading.value = true;
  try {
    // Notify user that PDF is being generated with formatting
    toast.info("Generating PDF with formatted content...");
    
    // Use a generic logo or estimate logo as fallback
    const logoUrl = profile.value?.estimate_logo || '';
    if (logoUrl) {
      img = await getBase64FromUrl(logoUrl);
    } else {
      img = imageHolder;
    }
    createInsurancePDF(report, path, action);
  } catch (error) {
    // Removed console.error
    toast.error("Error preparing PDF for download/sending.");
    img = imageHolder; // Fallback image
  } finally {
    loading.value = false;
  }
};

const sendAttachment = () => {
  client.value = props.customerData?.name || 'Customer';
  sender.value = profile.value?.firstName || 'Sender';
  company.value = profile.value?.company?.company_name || 'Company';

  if (!profile.value) {
    toast.warning("Company profile not loaded yet. Please wait.");
    fetchProfile().then(() => {
      prepareAndGeneratePDF(insuranceForm, `InsuranceReport_${insuranceForm.number || 'Details'}.pdf`, 'whatsapp');
    });
  } else {
    prepareAndGeneratePDF(insuranceForm, `InsuranceReport_${insuranceForm.number || 'Details'}.pdf`, 'whatsapp');
  }
};

// --- Lifecycle ---
onMounted(() => {
  // Fetch profile data initially
  fetchProfile(); // Ensure profile is fetched for PDF details

  // Load PDFKit and BlobStream via script tags
  if (!document.querySelector('script[src*="pdfkit.standalone.js"]')) {
    let pdfKitTag = document.createElement("script");
    pdfKitTag.setAttribute("src", "https://github.com/foliojs/pdfkit/releases/download/v0.13.0/pdfkit.standalone.js");
    pdfKitTag.setAttribute("type", "text/javascript");
    document.head.append(pdfKitTag);
  }

  if (!document.querySelector('script[src*="blob-stream.js"]')) {
    let blobStreamTag = document.createElement("script");
    blobStreamTag.setAttribute("src", "https://github.com/devongovett/blob-stream/releases/download/v0.1.3/blob-stream.js");
    blobStreamTag.setAttribute("type", "text/javascript");
    document.head.append(blobStreamTag);
  }
});


// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form
    prefillForm(props.customerData);
  }
});

</script>

<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="fixed z-30 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-500/75 dark:bg-black/80 transition-opacity" aria-hidden="true" @click="closeModal"></div>
        <!-- Modal positioning -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <!-- Modal panel - Using larger size for easier editing of insurance reports -->
        <div class="modal-content-modern modal-content-large">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Insurance Report' : 'Add New Insurance Report' }}
            <span v-if="customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <!-- WhatsApp Modal -->
          <modal v-if="isOpen" :website="userStore.currentWebsite" :body="body" :isOpen="isOpen" :blob="blob" :client="client" :sender="sender" :company="company" :phone="props.customerData?.phone" name="Insurance Report" @close-modal="closeModalWA"></modal>
          
          <form @submit.prevent="handleSave" class="space-y-4">
            <div class="max-h-[70vh] overflow-y-auto pr-2">
              <!-- Insurance Report Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Report Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label for="insurance-number" class="label-modern">Report Number</label>
                    <input
                      type="text"
                      id="insurance-number"
                      v-model="insuranceForm.number"
                      :readonly="!isEditing"
                      :class="['input-modern', { 'bg-gray-100 dark:bg-gray-700/80 cursor-not-allowed': !isEditing }]"
                      placeholder="Auto-generated..." />
                  </div>
                   <div>
                    <label for="insurance-date" class="label-modern">Report Date</label>
                    <input type="date" id="insurance-date" v-model="insuranceForm.report_date" required class="input-modern" />
                  </div>
                  <div class="sm:col-span-3">
                    <label for="insurance-status" class="label-modern">Status</label>
                    <select id="insurance-status" v-model="insuranceForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in INSURANCE_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                   <div class="sm:col-span-3">
                    <label for="insurance-notes" class="label-modern">Details / Notes</label>
                    <TipTapEditor id="insurance-notes" v-model="insuranceForm.notes" placeholder="Enter details about the insurance report or claim..." class="input-modern min-h-[300px]" />
                  </div>
                  <!-- Add more fields here if needed (Provider, Policy No, Claim No, etc.) -->
                </div>
              </div>

            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <!-- WhatsApp Button -->
              <button @click="sendAttachment" type="button" class="btn-secondary-modern w-full sm:w-auto bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50" :disabled="loading">
                <font-awesome-icon :icon="['fab', 'whatsapp']" class="mr-1.5 h-4 w-4" /> WhatsApp
              </button>
              <!-- Save & Download Button -->
              <button @click="save_type = 'download'; handleSave()" type="button" class="btn-secondary-modern w-full sm:w-auto" :disabled="loading">
                 <svg class="w-4 h-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 {{ loading && save_type === 'download' ? 'Saving...' : 'Save & Download' }}
              </button>
              <!-- Save Button (acts as primary submit) -->
              <button @click="save_type = 'save'" type="submit" class="btn-primary-modern w-full sm:w-auto" :disabled="loading">
                 <svg class="w-4 h-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 {{ loading && save_type === 'save' ? 'Saving...' : 'Save Report' }} <!-- Changed text -->
              </button>
              <!-- Cancel Button -->
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto mr-auto"> <!-- Added mr-auto -->
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Re-use styles from View.vue or global styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat bg-right;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-size: 1.5em 1.5em;
}
.dark .input-modern--select {
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
}
.label-modern {
  @apply block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}
.btn-primary-modern {
  @apply inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 dark:bg-indigo-500 rounded-md shadow-sm;
  @apply hover:bg-indigo-700 dark:hover:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.modal-content-modern {
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6 sm:p-8;
}

/* Larger modal for easier editing */
.modal-content-large {
  @apply sm:max-w-4xl; /* Much wider modal */
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content-modern,
.modal-fade-leave-active .modal-content-modern {
  transition: all 0.3s ease;
}
.modal-fade-enter-from .modal-content-modern,
.modal-fade-leave-to .modal-content-modern {
   transform: translateY(20px) scale(0.98);
   opacity: 0;
}
/* Custom scrollbar for modal content */
.modal-content-modern .overflow-y-auto::-webkit-scrollbar { width: 6px; height: 6px; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-track { @apply bg-gray-100 dark:bg-gray-700/50; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb { @apply bg-gray-300 dark:bg-gray-600 rounded; }
.modal-content-modern .overflow-y-auto::-webkit-scrollbar-thumb:hover { @apply bg-gray-400 dark:bg-gray-500; }
</style>