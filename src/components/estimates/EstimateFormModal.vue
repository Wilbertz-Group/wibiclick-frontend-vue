<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import axios from 'axios';
// PDFDocument and blobStream will be loaded via script tags
import moment from 'moment';
import { useToast } from 'vue-toast-notification';
import { useUserStore } from '@/stores/UserStore';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import modal from "@/components/misc/modalWAMessage.vue";
import imageHolder from '@/helpers/logo.js';
import { getBase64FromUrl, generateTableRow } from '@/helpers/index.js'; // Assuming these exist in helpers

const props = defineProps({
  modelValue: { // Controls modal visibility (v-model)
    type: Boolean,
    required: true,
  },
  customerData: { // Pre-fill data
    type: Object,
    default: () => ({}),
  },
  estimateData: { // For editing existing estimate
    type: Object,
    default: null,
  }
});

const emit = defineEmits(['update:modelValue', 'estimate-saved']);

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
const estimateForm = reactive({
  id: '', // Will be empty for new estimates
  customerId: '',
  name: 'Estimate',
  status: 'sent',
  estimate_nr: 1,
  estimate_date: moment().format('YYYY-MM-DD'),
  estimate_due_date: moment().add(3, 'days').format('YYYY-MM-DD'),
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

const lineItem = reactive({
  name: '',
  description: '',
  amount: 0,
  quantity: 1,
  id: null, // For tracking if we're editing an existing item
});

const isEditingLineItem = computed(() => lineItem.id !== null);

const ESTIMATE_STATUSES = ['sent', 'accepted', 'rejected', 'pending', 'processing', 'paid'];

const isEditing = computed(() => !!estimateForm.id);
const lineItemTotal = computed(() => (Number(lineItem.amount) * Number(lineItem.quantity)).toFixed(2));

// --- Methods ---
const closeModal = () => {
  emit('update:modelValue', false);
};

const resetEstimateForm = () => {
  Object.assign(estimateForm, {
    id: '',
    customerId: '',
    name: 'Estimate',
    status: 'sent',
    estimate_nr: 1,
    estimate_date: moment().format('YYYY-MM-DD'),
    estimate_due_date: moment().add(3, 'days').format('YYYY-MM-DD'),
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
    amount: 1,
    quantity: 1,
    id: null,
  });
};

const prefillForm = async (customer) => {
  resetEstimateForm();
  
  // Fetch profile data if not already loaded
  if (!profile.value) {
    await fetchProfile();
  }
  
  // Fetch estimate number
  let estimate_number = 0;
  try {
    loading.value = true;
    const response = await axios.get('estimate_number?id=' + userStore.currentWebsite);
    estimate_number = response.data.estimate_number;
    loading.value = false;
  } catch (error) {
    console.error("Failed to get estimate number", error);
    toast.warning("Failed to get estimate number");
    loading.value = false;
  }
  
  if (customer && customer.id) {
    estimateForm.customer.id = customer.id;
    estimateForm.customer.name = customer.name || '';
    estimateForm.customer.phone = customer.phone || '';
    estimateForm.customer.address = customer.address || '';
    estimateForm.customerId = customer.id;
    
    // Set company and banking details from profile
    if (profile.value) {
      estimateForm.company = profile.value.company || estimateForm.company;
      estimateForm.banking = profile.value.banking || estimateForm.banking;
    }
    
    // Set estimate number
    estimateForm.estimate_nr = estimate_number + 1;
  }
  
  // If editing, populate with existing estimate data
  if (props.estimateData) {
    Object.assign(estimateForm, {
      id: props.estimateData.id,
      customerId: props.estimateData.customerId,
      name: props.estimateData.name || 'Estimate',
      status: props.estimateData.reason || 'sent',
      estimate_nr: props.estimateData.number || (estimate_number + 1),
      estimate_date: props.estimateData.issuedAt ? moment(props.estimateData.issuedAt).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      estimate_due_date: props.estimateData.dueAt ? moment(props.estimateData.dueAt).format('YYYY-MM-DD') : moment().add(3, 'days').format('YYYY-MM-DD'),
      subtotal: props.estimateData.subtotal || 0,
      paid: props.estimateData.deposit || 0,
      notes: props.estimateData.notes || '',
      items: props.estimateData.lineItem || [],
    });

    // Re-apply customer details from the main customer prop to ensure address is present
    if (customer && customer.id) {
        estimateForm.customer.id = customer.id; // Ensure ID is consistent
        estimateForm.customer.name = customer.name || '';
        estimateForm.customer.phone = customer.phone || '';
        estimateForm.customer.address = customer.address || '';
        // estimateForm.customerId = customer.id; // Already set by Object.assign if present in estimateData
    }
  }
  // Calculate initial sum after potentially loading items
  getSum(estimateForm.items);
};

const fetchProfile = async () => {
  try {
    loading.value = true;
    const response = await axios.get('profile?id=' + userStore.currentWebsite);
    profile.value = response.data;
    loading.value = false;
  } catch (error) {
    console.error("Failed to get profile data", error);
    toast.warning("Failed to get profile data");
    loading.value = false;
  }
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
      estimateForm.items[index] = {
        item: lineItem.name,
        description: lineItem.description,
        quantity: parseFloat(lineItem.quantity),
        amount: parseFloat(lineItem.amount),
        id: lineItem.id
      };
    } else {
      // Add new item
      estimateForm.items.push({
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
    getSum(estimateForm.items);
  }
};

const cancelEdit = () => {
  resetLineItemForm();
};

// Track removed items to properly disconnect them from the estimate
const removedItems = ref([]);

const removeItem = (index) => {
  const item = estimateForm.items[index];
  // Only track removal of items with non-numeric IDs (existing items in the database)
  if (item.id && isNaN(item.id)) {
    removedItems.value.push(item);
  }
  estimateForm.items.splice(index, 1);
  getSum(estimateForm.items);
};

const getSum = (array) => {
  if (array && array.length) { // Added check for array existence
    // Ensure quantity and amount are treated as numbers
    let values = array.map(item => (Number(item.quantity) || 0) * (Number(item.amount) || 0));
    let total = values.reduce((a, b) => a + b, 0);
    estimateForm.subtotal = total; // Assign the calculated total
    return total;
  } else {
    estimateForm.subtotal = 0;
    return 0;
  }
};

const saveEstimateOnly = async (closeAfterSave = true) => { // Added parameter
  loading.value = true;
  try {
    const payload = {
      reason: estimateForm.status,
      name: estimateForm.name,
      number: estimateForm.estimate_nr,
      issuedAt: moment(estimateForm.estimate_date).toISOString(),
      dueAt: moment(estimateForm.estimate_due_date).toISOString(),
      sales: estimateForm.subtotal,
      subtotal: estimateForm.subtotal,
      paid: parseFloat(estimateForm.paid) || 0, // Add paid field
      notes: estimateForm.notes,
      customerId: estimateForm.customer.id || estimateForm.customerId,
      // IMPORTANT: Ensure props.customerData.jobId is passed correctly when creating estimate from a job
      jobId: props.customerData?.jobId,
      employeeId: props.customerData?.employeeId || userStore.user?.id, // Add employeeId (fallback to current user)
      websiteId: userStore.currentWebsite, // Add websiteId from store
      items: estimateForm.items.map(item => {
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
      payload.id = estimateForm.id;
    }

    // First save the estimate
    const response = await axios.post('add-estimate?id=' + userStore.currentWebsite, payload);
    
    // If we're editing and have removed items, disconnect them from the estimate
    if (isEditing.value && removedItems.value.length > 0) {
      // Process each removed item
      for (const item of removedItems.value) {
        if (item.id && isNaN(item.id)) { // Only process items with non-numeric IDs (existing in DB)
          try {
            await axios.post('remove-estimate-item?id=' + userStore.currentWebsite, {
              id: estimateForm.id,
              item: { id: item.id },
              customerId: estimateForm.customerId
            });
            console.log(`Removed line item ${item.id} from estimate ${estimateForm.id}`);
          } catch (error) {
            console.error(`Failed to remove line item ${item.id}:`, error);
            // Continue with other items even if one fails
          }
        }
      }
      // Clear the removed items array
      removedItems.value = [];
    }
    
    toast.success(response.data.message || 'Estimate saved successfully');
    emit('estimate-saved');
    if (closeAfterSave) {
      closeModal();
    }
    return true; // Indicate success
  } catch (error) {
    console.error("Error submitting estimate:", error);
    toast.error(`Error submitting estimate: ${error.response?.data?.message || error.message}`);
    return false; // Indicate failure
  } finally {
    loading.value = false;
  }
};

const saveAndDownloadEstimate = async () => {
  // First, save the estimate data without closing the modal
  const savedSuccessfully = await saveEstimateOnly(false); 

  if (savedSuccessfully) {
    // If save was successful, prepare and download the PDF
    // Ensure profile is loaded
    if (!profile.value) {
      toast.warning("Company profile not loaded yet. Please wait.");
      await fetchProfile(); // Wait for profile
    }
    if (profile.value) {
       prepareAndGeneratePDF(estimateForm, `${estimateForm.customer.name || 'Estimate'}.pdf`, 'download');
       closeModal(); // Close modal after download starts
    } else {
      toast.error("Could not load profile data to generate PDF.");
    }
  } else {
    toast.error("Failed to save estimate, cannot download PDF.");
  }
};

const handleSave = () => {
  if (save_type.value === 'save') {
    saveEstimateOnly();
  } else if (save_type.value === 'download') {
    saveAndDownloadEstimate();
  }
  // WhatsApp is handled by a separate button/function (sendAttachment)
};


// --- PDF Generation & WhatsApp --- 

const closeModalWA = () => {
  isOpen.value = false;
};

const createEstimatePDF = (estimate, path, action = 'download') => {
  let doc;
  // Check if PDFDocument is available on window
  if (!window.PDFDocument || !window.blobStream) {
      toast.error("PDF generation library not loaded yet. Please wait a moment and try again.");
      console.error("PDFKit or BlobStream not found on window object.");
      return;
  }
  try {
    doc = new window.PDFDocument({ size: "A4", margin: 50 });
  } catch (error) {
    console.error("PDFKit Error:", error);
    toast.error("Failed to initialize PDF generation. Reload and try again!");
    return; // Stop if PDFDocument fails
  }

  const stream = doc.pipe(window.blobStream());

  // --- PDF Content Generation Functions (Adapted for estimateForm) ---
  function generateHeader(doc, estimate) {
    // This function relies on 'img' being available in its scope
    // We will fetch it before calling createEstimatePDF
    doc
      .image(img, 50, 45, { width: 50 })
      .fillColor("#444444")
      .fontSize(14)
      .text(estimate.company.name || '', 110, 57)
      .fontSize(10)
      .text(estimate.company.slogan || '', 110, 75)
      .text(estimate.company.name || '', 200, 50, { align: "right" })
      .text(estimate.company.address1 || '', 200, 65, { align: "right" })
      .text(`${estimate.company.address2 || ''} ${estimate.company.city || ''}`, 200, 80, { align: "right" })
      .text(`${estimate.company.state || ''}, ${estimate.company.country || ''}`, 200, 95, { align: "right" })
      .text(estimate.company.postal_code || '', 200, 110, { align: "right" })
      .text(`Email: ${estimate.company.email || ''}`, 200, 130, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, estimate) {
    doc.fillColor("#444444").fontSize(20).text("Estimate", 50, 160);
    generateHr(doc, 185);
    const customerInformationTop = 200, bankingDetails = 200, estimateSpace = 130;

    doc
      //Estimate Data
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Estimate Details:", 50, bankingDetails)
      .font("Helvetica")
      .text("Estimate #:", 50, customerInformationTop + 15)
      .text(estimate.estimate_nr, estimateSpace, customerInformationTop + 15)
      .text("Estimate Date:", 50, customerInformationTop + 30)
      .text(estimate.estimate_date, estimateSpace, customerInformationTop + 30)
      .text("Estimate Due:", 50, customerInformationTop + 45)
      .text(estimate.estimate_due_date, estimateSpace, customerInformationTop + 45)
      .font("Helvetica-Bold")
      .text("Balance Due:", 50, customerInformationTop + 60)
      .text(
        formatCurrency(estimate.subtotal - (estimate.paid || 0), estimate.company.currency_symbol),
        estimateSpace,
        customerInformationTop + 60
      )
      //Banking Details
      .font("Helvetica-Bold")
      .text("Banking Details:", 300, bankingDetails)
      .font("Helvetica")
      .text("Name:", 300, bankingDetails + 15)
      .text(estimate.banking.account_name || '', 380, bankingDetails + 15)
      .text("Bank Name:", 300, bankingDetails + 30)
      .text(estimate.banking.bank || '', 380, bankingDetails + 30)
      .text("Account #:", 300, bankingDetails + 45)
      .text(estimate.banking.account_number || '', 380, bankingDetails + 45)
      .text("Account Type:", 300, bankingDetails + 60)
      .text(estimate.banking.account_type || '', 380, bankingDetails + 60)
      .text("Branch Code:", 300, bankingDetails + 75)
      .text(estimate.banking.branch_code || '', 380, bankingDetails + 75)
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
      .text(estimate.customer.name || '', 130, billed_to + 15)
      .text("Address:", 50, billed_to + 30)
      .text(estimate.customer.address || '', 130, billed_to + 30)
      .text("Phone:", 50, billed_to + 45)
      .text(estimate.customer.phone || '', 130, billed_to + 45)
      .text("VAT:", 50, billed_to + 60)
      .text(estimate.customer.vat || '', 130, billed_to + 60)
      .moveDown();

    generateHr(doc, 400);
  }

  function generateEstimateTable(doc, estimate) {
    let i;
    const estimateTableTop = 425;

    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      estimateTableTop,
      "Item",
      "Description", // Added description header
      "Unit Cost",
      "Quantity",
      "Line Total"
    );
    generateHr(doc, estimateTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < estimate.items.length; i++) {
      const item = estimate.items[i];
      const position = estimateTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        item.item || item.name,
        item.description || '', // Added description
        formatCurrency(item.amount, estimate.company.currency_symbol),
        item.quantity,
        formatCurrency(item.amount * item.quantity, estimate.company.currency_symbol)
      );
      generateHr(doc, position + 20);
    }

    const subtotalPosition = estimateTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "Subtotal",
      "",
      formatCurrency(estimate.subtotal, estimate.company.currency_symbol)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      formatCurrency(estimate.paid || 0, estimate.company.currency_symbol)
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
      formatCurrency(estimate.subtotal - (estimate.paid || 0), estimate.company.currency_symbol)
    );
    doc.font("Helvetica");
  }

  function generateNotes(doc, estimate) {
    if (estimate.notes) {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Notes:", 50, 580) // Removed "Notes" label repetition
        .fontSize(10)
        .font("Helvetica")
        .text(
          estimate.notes,
          50,
          595,
          { align: "left", width: 500 } // Increased width for notes
        );
    }
  }

  function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Thank you for your business. Use the Estimate # as your payment reference.",
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
    // Assuming date is already in 'YYYY-MM-DD' format from the form
    return date; 
  }
  // --- End PDF Content Generation Functions ---

  // Add content to the document
  generateHeader(doc, estimate);
  generateCustomerInformation(doc, estimate);
  generateEstimateTable(doc, estimate);
  generateNotes(doc, estimate);
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
      toast.success("Estimate downloaded successfully");
    } else if (action === 'whatsapp') {
      blob.value = pdfBlob; // Set blob for WhatsApp modal
      isOpen.value = true; // Open WhatsApp modal
    }
  });
};

let img; // Variable to hold the logo image dataURL

const prepareAndGeneratePDF = async (estimate, path, action = 'download') => {
  loading.value = true;
  try {
    const logoUrl = profile.value?.estimate_logo || '';
    if (logoUrl) {
      img = await getBase64FromUrl(logoUrl);
    } else {
      img = imageHolder; // Use placeholder if no logo URL
    }
    createEstimatePDF(estimate, path, action);
  } catch (error) {
    console.error("Error preparing PDF:", error);
    toast.error("Error preparing PDF for download/sending.");
    img = imageHolder; // Fallback image
    // Optionally try generating PDF with fallback image
    // createEstimatePDF(estimate, path, action);
  } finally {
    loading.value = false;
  }
};

const sendAttachment = () => {
  client.value = estimateForm.customer?.name || 'Customer';
  sender.value = profile.value?.firstName || 'Sender';
  company.value = profile.value?.company?.company_name || 'Company';

  // Ensure profile is loaded before attempting to generate PDF
  if (!profile.value) {
    toast.warning("Company profile not loaded yet. Please wait.");
    fetchProfile().then(() => {
      prepareAndGeneratePDF(estimateForm, `${estimateForm.customer.name || 'Estimate'}.pdf`, 'whatsapp');
    });
  } else {
    prepareAndGeneratePDF(estimateForm, `${estimateForm.customer.name || 'Estimate'}.pdf`, 'whatsapp');
  }
};

// --- Watchers ---
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // When modal opens, prefill form with customer data
    prefillForm(props.customerData);
  }
});

// --- Lifecycle ---
onMounted(() => {
  // Fetch profile data initially
  fetchProfile();

  // Load PDFKit and BlobStream via script tags
  let pdfKitTag = document.createElement("script");
  pdfKitTag.setAttribute("src", "https://github.com/foliojs/pdfkit/releases/download/v0.13.0/pdfkit.standalone.js"); // Use latest version if possible
  pdfKitTag.setAttribute("type", "text/javascript");
  document.head.append(pdfKitTag);

  let blobStreamTag = document.createElement("script");
  blobStreamTag.setAttribute("src", "https://github.com/devongovett/blob-stream/releases/download/v0.1.3/blob-stream.js");
  blobStreamTag.setAttribute("type", "text/javascript");
  document.head.append(blobStreamTag);

  // Cleanup script tags on component unmount (optional but good practice)
  // import { onUnmounted } from 'vue'; // Add this import at the top
  // onUnmounted(() => {
  //   document.head.removeChild(pdfKitTag);
  //   document.head.removeChild(blobStreamTag);
  // });
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
            {{ isEditing ? 'Edit Estimate' : 'Add New Estimate' }}
            <span v-if="!isEditing && customerData?.name" class="text-base font-normal text-gray-500 dark:text-gray-400"> for {{ customerData.name }}</span>
          </h3>
          <!-- WhatsApp Modal -->
          <modal v-if="isOpen" :website="userStore.currentWebsite" :body="body" :isOpen="isOpen" :blob="blob" :client="client" :sender="sender" :company="company" :phone="estimateForm.customer.phone" name="Estimate" @close-modal="closeModalWA"></modal>
          
          <form @submit.prevent="handleSave" class="space-y-4">
            <div class="max-h-[60vh] overflow-y-auto pr-2">
              <!-- Estimate Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Estimate Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="estimate-name" class="label-modern">Estimate Title</label>
                    <input type="text" id="estimate-name" v-model="estimateForm.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="estimate-status" class="label-modern">Status</label>
                    <select id="estimate-status" v-model="estimateForm.status" required class="input-modern input-modern--select">
                      <option v-for="status in ESTIMATE_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                  <div>
                    <label for="estimate-number" class="label-modern">Estimate #</label>
                    <input type="number" id="estimate-number" v-model="estimateForm.estimate_nr" required class="input-modern" />
                  </div>
                  <div>
                    <label for="estimate-date" class="label-modern">Estimate Date</label>
                    <input type="date" id="estimate-date" v-model="estimateForm.estimate_date" required class="input-modern" />
                  </div>
                  <div>
                    <label for="estimate-due-date" class="label-modern">Due Date</label>
                    <input type="date" id="estimate-due-date" v-model="estimateForm.estimate_due_date" required class="input-modern" />
                  </div>
                </div>
              </div>

              <!-- Customer Details Section -->
              <div class="mb-6">
                <h4 class="text-md font-semibold mb-3 text-gray-800 dark:text-gray-200">Customer Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label for="customer-name" class="label-modern">Name</label>
                    <input type="text" id="customer-name" v-model="estimateForm.customer.name" required class="input-modern" />
                  </div>
                  <div>
                    <label for="customer-phone" class="label-modern">Phone</label>
                    <input type="tel" id="customer-phone" v-model="estimateForm.customer.phone" required class="input-modern" />
                  </div>
                  <div class="sm:col-span-2">
                    <label for="customer-address" class="label-modern">Address</label>
                    <textarea id="customer-address" v-model="estimateForm.customer.address" rows="2" class="input-modern"></textarea>
                  </div>
                  <div>
                    <label for="customer-vat" class="label-modern">VAT (Optional)</label>
                    <input type="text" id="customer-vat" v-model="estimateForm.customer.vat" class="input-modern" />
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
                      <tr v-if="estimateForm.items.length === 0">
                        <td colspan="5" class="px-3 py-3 text-sm text-center text-gray-500 dark:text-gray-400">No items added yet</td>
                      </tr>
                      <tr v-for="(item, index) in estimateForm.items" :key="item.id || index" class="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td class="px-3 py-2 text-sm">
                          <div class="font-medium text-gray-900 dark:text-white">{{ item.item || item.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</div>
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ item.quantity }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ estimateForm.company.currency_symbol || 'R' }}{{ item.amount }}</td>
                        <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ estimateForm.company.currency_symbol || 'R' }}{{ (item.quantity * item.amount).toFixed(2) }}</td>
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
                  <span class="text-sm text-gray-900 dark:text-white">{{ estimateForm.company.currency_symbol || 'R' }}{{ Number(estimateForm.subtotal).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-t border-gray-200 dark:border-gray-700">
                  <label for="estimate-paid" class="text-sm font-medium text-gray-700 dark:text-gray-300">Paid to Date</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">{{ estimateForm.company.currency_symbol || 'R' }}</span>
                    <input type="number" id="estimate-paid" v-model="estimateForm.paid" min="0" step="0.01" class="input-modern w-32 pl-7 pr-2 py-1 text-right" />
                  </div>
                </div>
                <div class="flex justify-between py-2 border-t border-b border-gray-200 dark:border-gray-700">
                  <span class="text-sm font-bold text-gray-700 dark:text-gray-300">Balance Due</span>
                  <span class="text-sm font-bold text-gray-900 dark:text-white">{{ estimateForm.company.currency_symbol || 'R' }}{{ Math.max(0, Number(estimateForm.subtotal) - Number(estimateForm.paid)).toFixed(2) }}</span>
                </div>
              </div>

              <!-- Notes Section -->
              <div>
                <label for="estimate-notes" class="label-modern">Notes (Optional)</label>
                <textarea id="estimate-notes" v-model="estimateForm.notes" rows="3" class="input-modern" placeholder="Add any additional notes here"></textarea>
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
                 {{ loading && save_type === 'save' ? 'Saving...' : 'Save Estimate' }}
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