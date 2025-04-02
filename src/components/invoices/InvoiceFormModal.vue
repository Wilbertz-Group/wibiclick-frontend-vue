<script setup>
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'; // Added nextTick
import axios from 'axios';
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import modal from "@/components/misc/modalWAMessage.vue";
import imageHolder from '@/helpers/logo.js';
import { getBase64FromUrl, generateTableRow } from '@/helpers/index.js'; // Assuming these exist in helpers
import JobFormModal from '@/components/jobs/JobFormModal.vue'; // Import Job Modal

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // Pre-fill data
    type: Object,
    default: () => ({}),
  },
  invoiceData: { // For editing existing invoice
    type: Object,
    default: null,
  },
  technicians: { // Accept technicians list
    type: Array,
    default: () => [],
  },
  customerJobs: { // Accept customer jobs list
    type: Array,
    default: () => [],
  }
});

const emit = defineEmits(['update:modelValue', 'invoice-saved']);

const userStore = useUserStore();
const toast = useToast();
const loading = ref(false);
const profile = ref(null);

const save_type = ref('save'); // 'save', 'download', 'whatsapp'
const isOpen = ref(false); // WhatsApp modal state
const blob = ref(null); // PDF blob for WhatsApp
const client = ref('');
const sender = ref('');
const company = ref('');
// --- Form State ---
const invoiceForm = reactive({
  id: '', // Will be empty for new invoices
  customerId: '',
  jobId: null, // Added jobId field
  employeeId: null, // Add employeeId field
  name: 'Invoice',
  status: 'sent',
  invoice_nr: 1,
  invoice_date: moment().format('YYYY-MM-DD'),
  invoice_due_date: moment().add(7, 'days').format('YYYY-MM-DD'),
  subtotal: 0,
  paid: 0,
  notes: '',
  items: [],
  customer: {
    id: '',
    name: '',
    address: '',
    phone: '',
    vat: '',
  },
  company: {
    name: '',
    email: '',
    slogan: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    currency_symbol: '',
  },
  banking: {
    account_name: '',
    bank: '',
    account_number: '',
    account_type: '',
    branch_code: '',
  },
});

// --- Job Modal State ---
const showJobModal = ref(false);
const associatedJob = ref(null); // To store fetched job data

const lineItem = reactive({
  name: '',
  description: '',
  amount: 0,
  quantity: 0,
  id: null, // For tracking if we're editing an existing item
});

const isEditingLineItem = computed(() => lineItem.id !== null);

const INVOICE_STATUSES = ['sent', 'pending', 'processing', 'paid', 'accepted'];

const isEditing = computed(() => !!invoiceForm.id);
const lineItemTotal = computed(() => (Number(lineItem.amount) * Number(lineItem.quantity)).toFixed(2));

// Computed property for Job Dropdown Options
const jobOptions = computed(() => {
  if (!props.customerJobs || props.customerJobs.length === 0) {
    return [{ value: null, label: 'No jobs found for customer' }];
  }
  // Sort jobs by createdAt descending (most recent first)
  const sortedJobs = [...props.customerJobs].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : 0;
    const dateB = b.createdAt ? new Date(b.createdAt) : 0;
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });

  return sortedJobs.map(job => ({
    value: job.id,
    // Format label: Job #ID - Date - Issue Snippet
    label: `Job - ${moment(job.createdAt).format('YYYY-MM-DD')} - ${job.issue?.substring(0, 30) || 'No Issue'}...`
  }));
});

const whatsappMessageBody = computed(() => {
  const customerName = invoiceForm.customer?.name || 'Valued Customer';
  const invoiceNumber = invoiceForm.invoice_nr || '[Invoice Number]';
  const currencySymbol = invoiceForm.company?.currency_symbol || 'R';
  const senderName = profile.value?.firstName || invoiceForm.company?.name || 'Us';
  // Calculate balance due correctly (as a number for comparison)
  const balanceDueNumber = Math.max(0, Number(invoiceForm.subtotal) - Number(invoiceForm.paid));
  const balanceDueFormatted = balanceDueNumber.toFixed(2);

  if (balanceDueNumber <= 0) {
    // Message for fully paid invoice
    return `Dear ${customerName},\n\nThank you for your prompt payment of Invoice #${invoiceNumber}. We greatly appreciate your business and timely settlement of the account.\n\nAttached, you'll find a copy of the paid invoice for your records. If you have any questions or need any further information, please don't hesitate to contact us.\n\nWe look forward to serving you again in the future.\n\nBest regards,\n${senderName}`;
  } else {
    // Message for invoice with balance due
    const dueDate = moment().add(1, 'days').format('LL'); // Calculate due date as tomorrow
    return `Dear ${customerName},\n\nI hope this message finds you well. Please find attached the invoice #${invoiceNumber} for the services rendered.\n\nThe balance due is ${currencySymbol}${balanceDueFormatted} and payment is due by ${dueDate}.\n\nShould you have any questions, feel free to reach out.\n\nBest regards,\n${senderName}`;
  }
});

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetInvoiceForm = () => {
  Object.assign(invoiceForm, {
    id: '',
    customerId: '',
    employeeId: null, // Reset employeeId
    name: 'Invoice',
    status: 'sent',
    invoice_nr: 1,
    invoice_date: moment().format('YYYY-MM-DD'),
    invoice_due_date: moment().add(7, 'days').format('YYYY-MM-DD'),
    subtotal: 0,
    paid: 0,
    notes: '',
    items: [],
    customer: {
      id: '',
      name: '',
      address: '',
      phone: '',
      vat: '',
    },
    company: {
      name: '',
      email: '',
      slogan: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      currency_symbol: '',
    },
    banking: {
      account_name: '',
      bank: '',
      account_number: '',
      account_type: '',
      branch_code: '',
    },
  });
  
  resetLineItemForm();
};

const resetLineItemForm = () => {
  Object.assign(lineItem, {
    name: '',
    description: '',
    amount: 0,
    quantity: 1,
    id: null,
  });
};

const prefillForm = async (customer) => {
  resetInvoiceForm();
  
  // Fetch profile data if not already loaded
  if (!profile.value) {
    await fetchProfile();
  }
  
  // Fetch invoice number
  let invoice_number = 0;
  try {
    loading.value = true;
    const response = await axios.get('invoice_number?id=' + userStore.currentWebsite);
    invoice_number = response.data.invoice_number;
    loading.value = false;
  } catch (error) {
    // Removed console.error
    toast.warning("Failed to get invoice number");
    loading.value = false;
  }
  
  if (customer && customer.id) {
    invoiceForm.customer.id = customer.id;
    invoiceForm.customer.name = customer.name || '';
    invoiceForm.customer.phone = customer.phone || '';
    invoiceForm.customer.address = customer.address || '';
    invoiceForm.customerId = customer.id;
    
    // Set company and banking details from profile
    if (profile.value) {
      invoiceForm.company = profile.value.company || invoiceForm.company;
      invoiceForm.banking = profile.value.banking || invoiceForm.banking;
    }
    
    // Set invoice number
    invoiceForm.invoice_nr = invoice_number + 1;
    // Set default employeeId (e.g., from job context or current user)
    invoiceForm.employeeId = customer.employeeId || userStore.user?.id || null;
  }
  
  // If editing, populate with existing invoice data
  if (props.invoiceData) {
    Object.assign(invoiceForm, {
      id: props.invoiceData.id,
      customerId: props.invoiceData.customerId,
      name: props.invoiceData.name || 'Invoice',
      status: props.invoiceData.reason || 'sent',
      invoice_nr: props.invoiceData.number || (invoice_number + 1),
      invoice_date: props.invoiceData.issuedAt ? moment(props.invoiceData.issuedAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      invoice_due_date: props.invoiceData.dueAt ? moment(props.invoiceData.dueAt).format('YYYY-MM-DD') : moment().add(7, 'days').format('YYYY-MM-DD'),
      subtotal: props.invoiceData.subtotal || props.invoiceData.sales || 0,
      paid: props.invoiceData.deposit || 0,
      notes: props.invoiceData.notes || '',
      items: props.invoiceData.lineItem || [],
      // Explicitly use invoiceData.employeeId if it exists, otherwise fallback
      employeeId: props.invoiceData.employeeId ?? (customer.employeeId || userStore.user?.id || null),
    });
    // Removed debug log
  }
  // Removed extra closing brace here

  // Determine the initial jobId
  let initialJobId = props.invoiceData?.jobId || null;

  // If no jobId on the invoice, default to the most recent customer job
  if (!initialJobId && props.customerJobs && props.customerJobs.length > 0) {
      // Use the computed jobOptions which are already sorted
      const mostRecentJob = jobOptions.value[0]; // First item is the most recent
      if (mostRecentJob && mostRecentJob.value) {
          initialJobId = mostRecentJob.value;
          // Removed console.log
      }
  }

  invoiceForm.jobId = initialJobId; // Set the determined jobId in the form

  // Fetch associated job details only if we have a valid jobId
  if (invoiceForm.jobId) {
      //fetchAssociatedJob(invoiceForm.jobId);
  } else {
      associatedJob.value = null; // Reset associated job data if no ID
  }
};

const fetchProfile = async () => {
  try {
    loading.value = true;
    const response = await axios.get('profile?id=' + userStore.currentWebsite);
    profile.value = response.data;
    loading.value = false;
  } catch (error) {
    // Removed console.error
    toast.warning("Failed to get profile data");
    loading.value = false;
  }
};

// --- Fetch Associated Job ---
const fetchAssociatedJob = async (jobId) => {
  if (!jobId) {
    associatedJob.value = null;
    return;
  }
  loading.value = true; // Use main loading indicator
  try {
    // Use query parameters for both job and website ID
    const response = await axios.get(`jobs?jobId=${jobId}&id=${userStore.currentWebsite}`);
    associatedJob.value = response.data.job; // Adjust based on actual API response
    // Removed console.log
  } catch (error) {
    // Removed console.error
    toast.error("Could not load associated job details.");
    associatedJob.value = null;
  } finally {
    loading.value = false;
  }
};

// --- Open Job Modal ---
const openEditJobModal = () => {
  if (associatedJob.value) {
    showJobModal.value = true;
  } else {
    toast.warning("No associated job found or loaded.");
  }
};

// --- Handle Job Saved ---
const handleJobSaved = async () => {
  // Refetch the job data after it's saved to update the UI if needed
  if (invoiceForm.jobId) {
    await fetchAssociatedJob(invoiceForm.jobId);
  }
  // Optionally show a toast or confirmation
  toast.info("Associated job updated.");
  // The JobFormModal closes itself via v-model
};

const editItem = (item, index) => {
  // Set the line item form with the selected item's values
  lineItem.name = item.item || item.name;
  lineItem.description = item.description || '';
  lineItem.amount = item.amount;
  lineItem.quantity = item.quantity;
  lineItem.id = item.id || Date.now(); // Use existing ID or create one
  lineItem.index = index; // Store the index for updating
};

const addItem = () => {
  if (lineItem.name && lineItem.amount && lineItem.quantity && lineItemTotal.value) {
    if (isEditingLineItem.value) {
      // Update existing item
      const index = lineItem.index;
      invoiceForm.items[index] = {
        item: lineItem.name,
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity),
        amount: parseFloat(lineItem.amount),
        id: lineItem.id
      };
    } else {
      // Add new item
      invoiceForm.items.push({
        item: lineItem.name,
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity),
        amount: parseFloat(lineItem.amount),
        id: Date.now() // Add unique ID for item management
      });
    }

    // Reset line item form
    resetLineItemForm();

    // Recalculate total
    getSum(invoiceForm.items);
  }
};

const cancelEdit = () => {
  resetLineItemForm();
};

// Track removed items to properly disconnect them from the invoice
const removedItems = ref([]);

const removeItem = (index) => {
  const item = invoiceForm.items[index];
  // Only track removal of items with non-numeric IDs (existing items in the database)
  if (item.id && isNaN(item.id)) {
    removedItems.value.push(item);
  }
  invoiceForm.items.splice(index, 1);
  getSum(invoiceForm.items);
};

const getSum = (array) => {
  if (array.length) {
    let values = array.map(item => item.quantity * item.amount);
    let total = values.reduce((a, b) => a + b, 0);
    invoiceForm.subtotal = total;
    return total;
  } else {
    invoiceForm.subtotal = 0;
    return 0;
  }
};

const saveInvoiceOnly = async (closeAfterSave = true) => { // Added parameter
  loading.value = true;
  try {
    const payload = {
      reason: invoiceForm.status,
      name: invoiceForm.name,
      number: invoiceForm.invoice_nr,
      issuedAt: moment(invoiceForm.invoice_date).toISOString(),
      dueAt: moment(invoiceForm.invoice_due_date).toISOString(),
      sales: invoiceForm.subtotal,
      subtotal: invoiceForm.subtotal,
      paid: parseFloat(invoiceForm.paid) || 0, // Add paid field
      notes: invoiceForm.notes,
      customerId: invoiceForm.customer.id || invoiceForm.customerId,
      jobId: invoiceForm.jobId, // Use jobId from the form state
      employeeId: invoiceForm.employeeId, // Send selected employeeId
      websiteId: userStore.currentWebsite,
      items: invoiceForm.items.map(item => {
        const lineItemPayload = {
          item: item.item || item.name,
          description: item.description,
          quantity: parseFloat(item.quantity),
          amount: parseFloat(item.amount)
        };
        // Only include 'id' if it exists and is NOT a number (i.e., likely a DB ID)
        if (item.id && isNaN(item.id)) {
          lineItemPayload.id = item.id;
        }
        return lineItemPayload;
      })
    };
    
    // If editing, include the ID
    if (isEditing.value) {
      payload.id = invoiceForm.id;
    }
// Removed debug log

// First save the invoice
const response = await axios.post('add-invoice?id=' + userStore.currentWebsite, payload);
    // Removed duplicate line above
    
    // If we're editing and have removed items, disconnect them from the invoice
    if (isEditing.value && removedItems.value.length > 0) {
      // Process each removed item
      for (const item of removedItems.value) {
        if (item.id && isNaN(item.id)) { // Only process items with non-numeric IDs (existing in DB)
          try {
            await axios.post('remove-invoice-item?id=' + userStore.currentWebsite, {
              id: invoiceForm.id,
              item: { id: item.id },
              customerId: invoiceForm.customerId
            });
            // Removed console.log
          } catch (error) {
            // Removed console.error
            // Continue with other items even if one fails
          }
        }
      }
      // Clear the removed items array
      removedItems.value = [];
    }
    
    toast.success(response.data.message || 'Invoice saved successfully');
    emit('invoice-saved', payload.id || response.data?.invoice?.id); // Emit saved ID
    
    if (closeAfterSave) {
      closeModal();
    }
    return true; // Indicate success
  } catch (error) {
    // Removed console.error
    toast.error(`Error submitting invoice: ${error.response?.data?.message || error.message}`);
    return false; // Indicate failure
  } finally {
    loading.value = false;
  }
};

const saveAndDownloadInvoice = async () => {
  // First, save the invoice data without closing the modal
  const savedSuccessfully = await saveInvoiceOnly(false);

  if (savedSuccessfully) {
    // If save was successful, prepare and download the PDF
    // Ensure profile is loaded
    if (!profile.value) {
      toast.warning("Company profile not loaded yet. Please wait.");
      await fetchProfile(); // Wait for profile
    }
    if (profile.value) {
       prepareAndGeneratePDF(invoiceForm, `${invoiceForm.customer.name || 'Invoice'}.pdf`, 'download');
       closeModal(); // Close modal after download starts
    } else {
      toast.error("Could not load profile data to generate PDF.");
    }
  } else {
    toast.error("Failed to save invoice, cannot download PDF.");
  }
};

const handleSave = () => {
  if (save_type.value === 'save') {
    saveInvoiceOnly();
  } else if (save_type.value === 'download') {
    saveAndDownloadInvoice();
  }
  // WhatsApp is handled by a separate button/function (sendAttachment)
};

// --- PDF Generation & WhatsApp ---

const closeModalWA = () => {
  isOpen.value = false;
};

// Adapted PDF generation functions for Invoices
const createInvoicePDF = (invoice, path, action = 'download') => {
  let doc;
  // Check if PDFDocument is available on window
  if (!window.PDFDocument || !window.blobStream) {
      toast.error("PDF generation library not loaded yet. Please wait a moment and try again.");
      // Removed console.error
      return;
  }
  try {
    doc = new window.PDFDocument({ size: "A4", margin: 50 });
  } catch (error) {
    // Removed console.error
    toast.error("Failed to initialize PDF generation. Reload and try again!");
    return; // Stop if PDFDocument fails
  }

  const stream = doc.pipe(window.blobStream());

  // --- PDF Content Generation Functions (Adapted for invoiceForm) ---
  function generateHeader(doc, invoice) {
    doc
      .image(img, 50, 45, { width: 50 })
      .fillColor("#444444")
      .fontSize(14)
      .text(invoice.company.name || '', 110, 57)
      .fontSize(10)
      .text(invoice.company.slogan || '', 110, 75)
      .text(invoice.company.name || '', 200, 50, { align: "right" })
      .text(invoice.company.address1 || '', 200, 65, { align: "right" })
      .text(`${invoice.company.address2 || ''} ${invoice.company.city || ''}`, 200, 80, { align: "right" })
      .text(`${invoice.company.state || ''}, ${invoice.company.country || ''}`, 200, 95, { align: "right" })
      .text(invoice.company.postal_code || '', 200, 110, { align: "right" })
      .text(`Email: ${invoice.company.email || ''}`, 200, 130, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, invoice) {
    doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160); // Changed to Invoice
    generateHr(doc, 185);
    const customerInformationTop = 200, bankingDetails = 200, invoiceSpace = 130;

    doc
      //Invoice Data
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Invoice Details:", 50, bankingDetails)
      .font("Helvetica")
      .text("Invoice #:", 50, customerInformationTop + 15)
      .text(invoice.invoice_nr, invoiceSpace, customerInformationTop + 15)
      .text("Invoice Date:", 50, customerInformationTop + 30)
      .text(invoice.invoice_date, invoiceSpace, customerInformationTop + 30)
      .text("Invoice Due:", 50, customerInformationTop + 45)
      .text(invoice.invoice_due_date, invoiceSpace, customerInformationTop + 45)
      .font("Helvetica-Bold")
      .text("Balance Due:", 50, customerInformationTop + 60)
      .text(
        formatCurrency(invoice.subtotal - (invoice.paid || 0), invoice.company.currency_symbol),
        invoiceSpace,
        customerInformationTop + 60
      )
      //Banking Details
      .font("Helvetica-Bold")
      .text("Banking Details:", 300, bankingDetails)
      .font("Helvetica")
      .text("Name:", 300, bankingDetails + 15)
      .text(invoice.banking.account_name || '', 380, bankingDetails + 15)
      .text("Bank Name:", 300, bankingDetails + 30)
      .text(invoice.banking.bank || '', 380, bankingDetails + 30)
      .text("Account #:", 300, bankingDetails + 45)
      .text(invoice.banking.account_number || '', 380, bankingDetails + 45)
      .text("Account Type:", 300, bankingDetails + 60)
      .text(invoice.banking.account_type || '', 380, bankingDetails + 60)
      .text("Branch Code:", 300, bankingDetails + 75)
      .text(invoice.banking.branch_code || '', 380, bankingDetails + 75)
      .moveDown();

    generateHr(doc, 300);

    //Billed To
    let billed_to = 315
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Billed To:", 50, billed_to)
      .font("Helvetica")
      .text("Name:", 50, billed_to + 15)
      .text(invoice.customer.name || '', 130, billed_to + 15)
      .text("Address:", 50, billed_to + 30)
      .text(invoice.customer.address || '', 130, billed_to + 30)
      .text("Phone:", 50, billed_to + 45)
      .text(invoice.customer.phone || '', 130, billed_to + 45)
      .text("VAT:", 50, billed_to + 60)
      .text(invoice.customer.vat || '', 130, billed_to + 60)
      .moveDown();

    generateHr(doc, 400);
  }

  function generateInvoiceTable(doc, invoice) { // Renamed
    let i;
    const invoiceTableTop = 425;

    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "Description",
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      const position = invoiceTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        item.item || item.name,
        item.description || '',
        formatCurrency(item.amount, invoice.company.currency_symbol),
        item.quantity,
        formatCurrency(item.amount * item.quantity, invoice.company.currency_symbol)
      );
      generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      formatCurrency(invoice.subtotal, invoice.company.currency_symbol)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      formatCurrency(invoice.paid || 0, invoice.company.currency_symbol)
    );

    const duePosition = paidToDatePosition + 25;
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      duePosition,
      "",
      "",
      "Balance Due",
      "",
      formatCurrency(invoice.subtotal - (invoice.paid || 0), invoice.company.currency_symbol)
    );
    doc.font("Helvetica");
  }

  function generateNotes(doc, invoice) {
    if (invoice.notes) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Notes:", 50, 580)
        .fontSize(10)
        .font("Helvetica")
        .text(
          invoice.notes,
          50,
          595,
          { align: "left", width: 500 }
        );
    }
  }

  function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Thank you for your business. Use the Invoice # as your payment reference.", // Changed to Invoice
        50,
        780,
        { align: "center", width: 500 }
      );
  }

  function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  }

  function formatCurrency(value, symbol = 'R') {
    return `${symbol}${Number(value).toFixed(2)}`;
  }

  function formatDate(date) {
    return date; 
  }
  // --- End PDF Content Generation Functions ---

  // Add content to the document
  generateHeader(doc, invoice);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice); // Renamed
  generateNotes(doc, invoice);
  generateFooter(doc);

  doc.end();

  stream.on("finish", function() {
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
      toast.success("Invoice downloaded successfully");
    } else if (action === 'whatsapp') {
      blob.value = pdfBlob; // Set blob for WhatsApp modal
      isOpen.value = true; // Open WhatsApp modal
    }
  });
};

let img; // Variable to hold the logo image dataURL

const prepareAndGeneratePDF = async (invoice, path, action = 'download') => {
  loading.value = true;
  try {
    const logoUrl = profile.value?.invoice_logo || profile.value?.estimate_logo || ''; // Use invoice logo if available, fallback to estimate logo
    if (logoUrl) {
      img = await getBase64FromUrl(logoUrl);
    } else {
      img = imageHolder; // Use placeholder if no logo URL
    }
    createInvoicePDF(invoice, path, action);
  } catch (error) {
    // Removed console.error
    toast.error("Error preparing PDF for download/sending.");
    img = imageHolder; // Fallback image
  } finally {
    loading.value = false;
  }
};

const sendAttachment = () => {
  client.value = invoiceForm.customer?.name || 'Customer';
  sender.value = profile.value?.firstName || 'Sender';
  company.value = profile.value?.company?.company_name || 'Company';

  // Ensure profile is loaded before attempting to generate PDF
  if (!profile.value) {
    toast.warning("Company profile not loaded yet. Please wait.");
    fetchProfile().then(() => {
      prepareAndGeneratePDF(invoiceForm, `${invoiceForm.customer.name || 'Invoice'}.pdf`, 'whatsapp');
    });
  } else {
    prepareAndGeneratePDF(invoiceForm, `${invoiceForm.customer.name || 'Invoice'}.pdf`, 'whatsapp');
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form with customer data
    // This will also handle setting the initial jobId and fetching the job
    prefillForm(props.customerData);
  } else {
      // Reset associated job when modal closes
      associatedJob.value = null;
  }
});

// Watch for changes in the selected Job ID dropdown
watch(() => invoiceForm.jobId, (newJobId, oldJobId) => {
  // Only fetch if the ID changed AND the new ID is not null
  if (newJobId !== oldJobId && newJobId !== null) {
    // Removed console.log
    //fetchAssociatedJob(newJobId); // Fetch details for the newly selected job
  } else if (newJobId === null) {
    // Explicitly clear associated job data if "-- Select Job --" is chosen
    associatedJob.value = null;
  }
});

// --- Lifecycle ---
onMounted(() => {
  // Fetch profile data initially
  fetchProfile();

  // Load PDFKit and BlobStream via script tags
  // Ensure these aren't loaded multiple times if the modal is opened repeatedly without page refresh
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

  // Note: Cleanup on unmount might be complex if multiple modals use these scripts.
  // Relying on browser caching and the check above is generally sufficient.
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
        <!-- Modal panel -->
        <div class="modal-content-modern">
          <h3 class="text-lg font-semibold mb-6 text-gray-900 dark:text-white" id="modal-title">
            {{ isEditing ? 'Edit Invoice' : 'Add New Invoice' }}
            <span v-if="!isEditing && customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <!-- WhatsApp Modal -->
          <modal v-if="isOpen" :website="userStore.currentWebsite" :body="whatsappMessageBody" :isOpen="isOpen" :blob="blob" :client="client" :sender="sender" :company="company" :phone="invoiceForm.customer.phone" name="Invoice" @close-modal="closeModalWA"></modal> <!-- Changed :body="body" to :body="whatsappMessageBody" -->
        
          <!-- Nested Job Form Modal -->
          <JobFormModal
            v-model="showJobModal"
            :customer-data="invoiceForm.customer"
            :job-data="associatedJob"
            @job-saved="handleJobSaved"
          />
          <form @submit.prevent="handleSave" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2">
              <!-- Invoice Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Invoice Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="invoice-name" class="label-modern">Invoice Title</label>
                    <input type="text" id="invoice-name" v-model="invoiceForm.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-status" class="label-modern">Status</label>
                    <select id="invoice-status" v-model="invoiceForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in INVOICE_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                  <div>
                    <label for="invoice-number" class="label-modern">Invoice #</label>
                    <input type="number" id="invoice-number" v-model="invoiceForm.invoice_nr" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-date" class="label-modern">Invoice Date</label>
                    <input type="date" id="invoice-date" v-model="invoiceForm.invoice_date" required class="input-modern" />
                  </div>
                  <div>
                    <label for="invoice-due-date" class="label-modern">Due Date</label>
                    <input type="date" id="invoice-due-date" v-model="invoiceForm.invoice_due_date" required class="input-modern" />
                  </div>
                  <!-- Technician Dropdown -->
                  <div class="sm:col-span-2">
                    <label for="invoice-technician" class="label-modern">Technician</label>
                    <select id="invoice-technician" v-model="invoiceForm.employeeId" class="input-modern input-modern--select">
                      <option :value="null">-- Select Technician --</option>
                      <option v-for="tech in technicians" :key="tech.id" :value="tech.id">
                        {{ tech.firstName }} {{ tech.lastName }}
                      </option>
                    </select>
                  </div>
                  <!-- Job Selection Dropdown -->
                   <div class="sm:col-span-2">
                     <label for="invoice-job" class="label-modern">Associated Job (Optional)</label>
                     <select id="invoice-job" v-model="invoiceForm.jobId" class="input-modern input-modern--select">
                       <option :value="null">-- Select Job --</option>
                       <option v-for="job in jobOptions" :key="job.value" :value="job.value">
                         {{ job.label }}
                       </option>
                     </select>
                   </div>
                </div>
              </div>

              <!-- Customer Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Customer Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="customer-name" class="label-modern">Name</label>
                    <input type="text" id="customer-name" v-model="invoiceForm.customer.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="customer-phone" class="label-modern">Phone</label>
                    <input type="tel" id="customer-phone" v-model="invoiceForm.customer.phone" required class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="customer-address" class="label-modern">Address</label>
                    <textarea id="customer-address" v-model="invoiceForm.customer.address" rows="2" class="input-modern"></textarea>
                  </div>
                  <div>
                    <label for="customer-vat" class="label-modern">VAT (Optional)</label>
                    <input type="text" id="customer-vat" v-model="invoiceForm.customer.vat" class="input-modern" />
                  </div>
                </div>
              </div>

              <!-- Line Items Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Line Items</h4>
                
                <!-- Line Items Table -->
                <div class="overflow-x-auto mb-4">
                  <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                        <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                      <tr v-if="invoiceForm.items.length === 0">
                        <td colspan="5" class="px-3 py-3 text-sm text-center text-gray-500 dark:text-gray-400">No items added yet</td>
                      </tr>
                      <tr v-for="(item, index) in invoiceForm.items" :key="item.id || index" class="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td class="px-3 py-2 text-sm">
                          <div class="font-medium text-gray-900 dark:text-white">{{ item.item || item.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</div>
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ item.quantity }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ item.amount }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ (item.quantity * item.amount).toFixed(2) }}</td>
                        <td class="px-3 py-2 text-sm">
                          <div class="flex space-x-2">
                            <button type="button" @click="editItem(item, index)" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button type="button" @click="removeItem(index)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Add Line Item Form -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div class="sm:col-span-5">
                    <label for="item-name" class="label-modern">Item Name</label>
                    <input type="text" id="item-name" v-model="lineItem.name" class="input-modern" placeholder="Enter item name" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-quantity" class="label-modern">Quantity</label>
                    <input type="number" id="item-quantity" v-model="lineItem.quantity" min="1" class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-price" class="label-modern">Price</label>
                    <input type="number" id="item-price" v-model="lineItem.amount" min="0" step="0.01" class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="item-total" class="label-modern">Total</label>
                    <input type="text" id="item-total" :value="lineItemTotal" readonly class="input-modern bg-gray-100 dark:bg-gray-700" />
                  </div>
                  <div class="sm:col-span-1 flex items-end">
                    <div v-if="isEditingLineItem" class="flex flex-col space-y-2 w-full">
                      <button type="button" @click="addItem" class="btn-primary-modern w-full h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button type="button" @click="cancelEdit" class="btn-secondary-modern w-full h-10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button v-else type="button" @click="addItem" class="btn-primary-modern w-full h-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div class="sm:col-span-12">
                    <label for="item-description" class="label-modern">Description (Optional)</label>
                    <textarea id="item-description" v-model="lineItem.description" rows="2" class="input-modern" placeholder="Enter item description"></textarea>
                  </div>
                </div>
              </div>

              <!-- Totals Section -->
              <div class="mb-6">
                <div class="flex justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
                  <span class="text-sm text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ Number(invoiceForm.subtotal).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                  <label for="invoice-paid" class="text-sm font-medium text-gray-700 dark:text-gray-300">Paid to Date</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">{{ invoiceForm.company.currency_symbol || 'R' }}</span>
                    <input type="number" id="invoice-paid" v-model="invoiceForm.paid" min="0" step="1" class="input-modern w-32 pl-7 pr-2 py-1 text-right" />
                  </div>
                </div>
                <div class="flex justify-between py-2 border-t border-b border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Balance Due</span>
                  <span class="text-sm font-bold text-gray-900 dark:text-white">{{ invoiceForm.company.currency_symbol || 'R' }}{{ Math.max(0, Number(invoiceForm.subtotal) - Number(invoiceForm.paid)).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Notes Section -->
              <div>
                <label for="invoice-notes" class="label-modern">Notes (Optional)</label>
                <textarea id="invoice-notes" v-model="invoiceForm.notes" rows="3" class="input-modern" placeholder="Add any additional notes here"></textarea>
              </div>
            </div>

            <div class="pt-5 sm:pt-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-gray-200 dark:border-gray-700/50">
              <!-- Edit Job Button (Conditional) -->
              <button v-if="isEditing && associatedJob" @click="openEditJobModal" type="button" class="btn-secondary-modern w-full sm:w-auto" :disabled="loading">
                 <font-awesome-icon icon="briefcase" class="mr-1.5 h-4 w-4" /> <!-- Assuming briefcase icon -->
                 Edit Job #{{ associatedJob.id }}
              </button>
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
                 {{ loading && save_type === 'save' ? 'Saving...' : 'Save Invoice' }}
              </button>
              <!-- Cancel Button -->
              <button @click="closeModal" type="button" class="btn-secondary-modern w-full sm:w-auto mr-auto"> <!-- Added mr-auto to push cancel left -->
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
  @apply inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:w-full p-6 sm:p-8;
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