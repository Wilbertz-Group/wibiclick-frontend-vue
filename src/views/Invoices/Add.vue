<script setup>
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watchEffect } from "vue";
import { useToast } from "vue-toast-notification";
import { useRoute, useRouter } from "vue-router";
import { computed } from "@vue/reactivity";
import { autocomplete } from "@/helpers/custom-input.js"
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import imageHolder from '../../helpers/logo.js'

const loading = ref(false);
const all_jobs = ref();
const job = ref();
const profile = ref(false);
const selectedJob = ref();
const jobsData = ref({job: 'Select Job'});
const toast = useToast();
const router = useRouter();
const route = useRoute()
const modalOpen = ref(false)
const searchLineItems = ref([])

const userStore = useUserStore();
const status = ref(userStore.status);

const invoice = ref({
	company: {
		name: "",
		email: "",
		slogan: "",
		address1: "",
		address2: "",
		city: "",
		state: "",
		country: "",
		postal_code: "",
    currency_symbol: "",
	},
	customer: {
		name: "",
		address: "",
		phone: "",
		vat: "",
	},
	banking: {
		account_name: "",
		bank: "",
		account_number: "",
		account_type: "",
		branch_code: "",
	},
	items: [],
	subtotal: 0,
	paid: 0,
  status: "sent",
	name: "Invoice",
  notes: "",
	invoice_nr: 1,
	invoice_date: moment().format('YYYY-MM-DD'),
	invoice_due_date: moment().add(1, 'days').format('YYYY-MM-DD'),  
});

const lineItem = ref({
  name: '',
  description: '',
  amount: 1,
  quantity: 1,
})

async function getLineItems() {
  try {
    const res = await axios.get(
      `lineitems?id=${userStore.currentWebsite}`
    );
    
    const data = await res.data
    searchLineItems.value = data.names    
  } catch (error) {
    searchLineItems.value = []
  }  
}

function addItem() {
  if (lineItem.value.name && lineItem.value.amount && lineItem.value.quantity && lineItemTotal.value) {
    invoice.value.items.push({
			item: lineItem.value.name,
			description: lineItem.value.description,
			quantity: lineItem.value.quantity,
			amount: lineItem.value.amount,
		})

    lineItem.value = {
      name: '',
      description: '',
      amount: 1,
      quantity: 1,
    }

    getSum(invoice.value.items)
  }
}

function getSum(array){
  if( array.length ){
    let values = array.map(item => item.quantity * item.amount)
    let total = values.reduce((a, b) => a + b);
    invoice.value.subtotal = total - invoice.value.paid
    return total;
  } else {
    return 0
  }
}

function deleteItem(i) {
  invoice.value.items.splice(i, 1);
}

async function checkParams() {
  if( route.query.job_id ){    
    try {
      loading.value = true
      const response = await axios.get(
        `jobs?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );

      all_jobs.value = response.data.jobs
      let jobs = {};

      for (const job of response.data.jobs) {
        jobs[job.id] = job.name
      }

      jobsData.value = jobs
      loading.value = false

      updateJob({job: route.query?.job_id})
    } catch (error) {
      console.log(error);
      loading.value = false
      toast.error("Error getting jobs data")
    }
  } else {
    toast.warning("Job id is required to create an invoice")
    fetchJobs()
  }
} 

async function fetchJobs() {
  try {
    loading.value = true
    const response = await axios.get(
      `jobs?id=${userStore.currentWebsite}&limit=1500&offset=0`
    );

    all_jobs.value = response.data.jobs
    let jobs = {};

    for (const job of response.data.jobs) {
      jobs[job.id] = job.name
    }

    jobsData.value = jobs
    loading.value = false
    modalOpen.value = true
  } catch (error) {
    console.log(error);
    loading.value = false
    modalOpen.value = true
    toast.error("Error getting jobs data")
  }
}

async function updateJob(data){
  let job_data = all_jobs.value.filter(e => { return e.id == data.job })[0]
  job.value = job_data

  if(!profile.value){
    try {
      loading.value = true
      const response = await axios.get('profile?id='+ userStore.currentWebsite);
      profile.value = response.data
      loading.value = false
    } catch (error) {
      console.log(error)
      toast.warning("Failed to get Company Data")
      loading.value = false
    }
  }

  let invoice_number = 0;

  try {
    loading.value = true
    const response = await axios.get('invoice_number?id='+ userStore.currentWebsite);
    invoice_number = response.data.invoice_number
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.warning("Failed to get invoice number")
    loading.value = false
  }

  invoice.value = {
    company: profile.value.company,
    customer: {
      id: job_data.customer.id,
      name: job_data.customer.name,
      address: job_data.address,
      phone: job_data.phone,
      vat: "",
    },
    banking: profile.value.banking,
    items: [],
    subtotal: 0,
    paid: 0,
    status: "sent",
    name: "Invoice",
    notes: "",
    invoice_nr: invoice_number + 1,
    invoice_date: moment().format('YYYY-MM-DD'),
    invoice_due_date: moment().add(1, 'days').format('YYYY-MM-DD'),
  }
  modalOpen.value = false
}

async function saveInvoice(data) {
  let invoice_number = 0;

  try {
    loading.value = true
    const response = await axios.get('invoice_number?id='+ userStore.currentWebsite);
    invoice_number = response.data.invoice_number
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.warning("Failed to get invoice number")
    loading.value = false
  }

  let payload = {
    jobId: job.value.id,
    reason: invoice.value.status,
    name: invoice.value.name,
    number: invoice_number + 1,
    issuedAt: moment(invoice.value.invoice_date,).toISOString(),
    dueAt: moment(invoice.value.invoice_due_date,).toISOString(),
    sales: invoice.value.subtotal,
    subtotal: invoice.value.subtotal, 
    notes: invoice.value.notes,
    customerId: invoice.value.customer.id,
    employeeId: job.value.employee.id,
    websiteId: job.value.website.id,
    items: invoice.value.items
  }

  try {
    loading.value = true
    const response = await axios.post('add-invoice?id='+ userStore.currentWebsite, payload);
    toast.success(response.data.message)
    loading.value = false   
  } catch (error) {
    console.log(error)
    loading.value = false
  }

  function createInvoice(invoice, path) {
    let doc;

    try {
      doc = new PDFDocument({ size: "A4", margin: 50 });
    } catch (error) {
      toast.error("Failed failed to initialize the pdf generation, Reload you page and try again!!")
    }

    // pipe the document to a blob
    const stream = doc.pipe(blobStream());

    // add your content to the document here, as usual
    generateHeader(doc, invoice);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateNotes(doc, invoice);
    generateFooter(doc);

    doc.end();

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    let blob;

    function download() {
      if (!blob) return;
      toast.success("Downloading your Invoice")
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = path;
      a.click();
      window.URL.revokeObjectURL(url);
      router.push({ name: 'invoices' })
    }

    stream.on("finish", function() {
      // get a blob you can do whatever you like with
      blob = stream.toBlob("application/pdf");
      download();
    });

  }

  function get_url_extension( url ) {
    return url.split(/[#?]/)[0].split('.').pop().trim();
  }

  let img;
  
  try {
    var url = profile.value.estimate_logo;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    // Set responseType to 'arraybuffer', we want raw binary data buffer
    xhr.responseType = 'arraybuffer';

    xhr.onload = function() {
      // Create an array of 8-bit unsigned integers
      var arr = new Uint8Array(this.response);
      
      // String.fromCharCode returns a 'string' from the specified sequence of Unicode values
      var raw = String.fromCharCode.apply(null, arr);
      
      //btoa() creates a base-64 encoded ASCII string from a String object 
      var b64 = btoa(raw);
      
      var dataType = get_url_extension(url);
      //ta-da your image data url!
      var dataURL = 'data:image/' + dataType + ';base64,' + b64;

      img = dataURL
    };

    xhr.send();    
  } catch (error) {
    img = imageHolder
  }

  function generateHeader(doc, invoice) {
    doc
      .image(img, 50, 45, { width: 50 })
      // .image("lg.png", 50, 45, { width: 50 })
      .fillColor("#444444")
      .fontSize(14)
      .text(invoice.company.name, 110, 57)		
      .fontSize(10)
      .text(invoice.company.slogan, 110, 75)
      .text(invoice.company.name, 200, 50, { align: "right" })
      .text(invoice.company.address1, 200, 65, { align: "right" })
      .text(invoice.company.address2 + " " + invoice.company.city, 200, 80, { align: "right" })
      .text(invoice.company.state + ", " + invoice.company.country, 200, 95, { align: "right" })
      .text(invoice.company.postal_code, 200, 110, { align: "right" })
      .text("Email: "+invoice.company.email, 200, 130, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, invoice) {
    doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200, bankingDetails = 200, invoiceSpace = 130;

    doc
      //Invoice Data
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Invoice Details:", 50, bankingDetails)
      .font("Helvetica")
      .text("Invoice #:", 50, customerInformationTop + 15)		
      .text(invoice_number + 1, invoiceSpace, customerInformationTop + 15)		
      .text("Invoice Date:", 50, customerInformationTop + 30)
      .text(invoice.invoice_date, invoiceSpace, customerInformationTop + 30)
      .text("Invoice Due:", 50, customerInformationTop + 45)
      .text(invoice.invoice_due_date, invoiceSpace, customerInformationTop + 45)
      .font("Helvetica-Bold")
      .text("Balance Due:", 50, customerInformationTop + 60)
      .text(
        formatCurrency(invoice.subtotal),
        invoiceSpace,
        customerInformationTop + 60
      )

      //Banking Details
      .font("Helvetica-Bold")
      .text("Banking Details:", 300, bankingDetails)
      .font("Helvetica")
      .text("Name:", 300, bankingDetails  + 15)		
      .text(invoice.banking.account_name, 380, bankingDetails  + 15)		
      .text("Bank Name:", 300, bankingDetails + 30)
      .text(invoice.banking.bank, 380, bankingDetails + 30)
      .text("Account #:", 300, bankingDetails + 45)
      .text(invoice.banking.account_number, 380, bankingDetails + 45)
      .text("Account Type:", 300, bankingDetails + 60)
      .text(invoice.banking.account_type, 380, bankingDetails + 60)
      .text("Branch Code:", 300, bankingDetails + 75)
      .text(invoice.banking.branch_code, 380, bankingDetails + 75)
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
    .text(invoice.customer.name, 130, billed_to + 15)
    .text("Address:", 50, billed_to + 30)
    .text(invoice.customer.address, 130, billed_to + 30)
    .text("Phone:", 50, billed_to + 45)
    .text(invoice.customer.phone, 130, billed_to + 45)
    .text("VAT:", 50, billed_to + 60)
    .text(invoice.customer.vat, 130, billed_to + 60)
    .moveDown();

    generateHr(doc, 400);
  }

  function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 425;

    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Item",
      "",
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
        item.name || item.item,
        item.description,
        formatCurrency(item.amount),
        item.quantity,
        formatCurrency(item.amount * item.quantity)
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
      formatCurrency(invoice.subtotal)
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      paidToDatePosition,
      "",
      "",
      "Paid To Date",
      "",
      formatCurrency(invoice.paid)
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
      formatCurrency(invoice.subtotal)
    );
    doc.font("Helvetica");
  }

  function generateNotes(doc, invoice) {
    if(invoice.notes){
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Notes:", 50, 580, "Notes")
        .fontSize(10)
        .font("Helvetica")
        .text(
          invoice.notes,
          50,
          595,
          { align: "left", width: 250 }
        );
    }
  }

  function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Thank you for your business, your payment is due within 1 day. Use the Invoice # as your payment reference.",
        50,
        780,
        { align: "center", width: 500 }
      );
  }

  function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
  ) {
    doc
      .fontSize(9)
      .text(item, 50, y)
      .fontSize(7)
      .text(description, 50, y + 10)
      .fontSize(9)
      .text(unitCost, 350, y, { width: 90, align: "right" })
      .text(quantity, 400, y, { width: 90, align: "right" })
      .text(lineTotal, 0, y, { align: "right" });
  }

  function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
  }

  function formatCurrency(cents) {
    //return "R" + (cents / 100).toFixed(2);
    return "R" + cents;
  }

  function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return year + "/" + month + "/" + day;
  }
  
  createInvoice(invoice.value, invoice.value.customer.name + '.pdf');
  
}

const lineItemTotal = computed(() => Number(lineItem.value.amount) * Number(lineItem.value.quantity))

onMounted(()=>{
  getLineItems();
  checkParams();
  let tag = document.createElement("script");
  tag.setAttribute("src", "https://github.com/foliojs/pdfkit/releases/download/v0.12.1/pdfkit.standalone.js");
  tag.setAttribute("type", "text/javascript");
  document.head.append(tag);

  tag = document.createElement("script");
  tag.setAttribute("src", "https://github.com/devongovett/blob-stream/releases/download/v0.1.3/blob-stream.js");
  tag.setAttribute("type", "text/javascript");
  document.head.append(tag);
  if(invoice.value.items){
    getSum(invoice.value.items)
  }
})

</script>

<template>
  <Header title="Add new invoice" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
        <FormKit
          type="form"
          id="edit"
          :form-class="submitted ? 'hide' : 'show'"
          submit-label="Update"
          @submit="saveInvoice"
          :actions="false"
          
        >
          <div class="status-container">
            <p class="status-title">Status</p>
            <FormKit 
              type="select" 
              v-model="invoice.status" 
              name="invoice_status" 
              :options="['pending', 'processing', 'paid']" 
              outer-class="status-body text-left mb-0"
              inner-class="border-none focus-within:border-none shadow-none focus-within:shadow-none"  
              input-class="bg-[#0275ff] text-white m-0"
            />

            <div class="btn-container">
              <FormKit type="submit" @click="save_type = 'download'" class="btn btn-mark mt-2" outer-class="mb-0"  label="Save & Download" suffix-icon="download" />
            </div>
          </div>

          <div class="pl-5 pr-10 pt-5">
            <!-- Invoice Header -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
              <div class="flex items-center">
                <img src="@/assets/images/lg.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Invoice Logo">
                <div>
                  <h3 class="text-3xl">{{ invoice.company.name }}</h3> 
                  <h3 class="text-xl">{{ invoice.company.slogan }}</h3> 
                </div>
              </div> 
              <div class="text-right">
                <div class="text-lg">{{invoice.company.name}}</div>
                <div class="text-lg">{{invoice.company.address1}}</div>
                <div class="text-lg">{{invoice.company.address2 + " " + invoice.company.city}}</div>
                <div class="text-lg">{{invoice.company.state + ", " + invoice.company.country}}</div>
                <div class="text-lg">{{invoice.company.postal_code}}</div>
                <div class="text-lg">Email: {{invoice.company.email}}</div>
              </div>
            </div>

            <!-- Invoice Sub-Header -->
            <div>
              <div class="text-5xl mt-10">
                <FormKit 
                  type="text" 
                  name="invoice_title" 
                  validation="required" 
                  :value="invoice.name" 
                  :classes="{ outer: 'p-2 bg-slate-100', inner: { $reset: true } }" 
                  input-class="p-0 m-0"
                />
              </div>
              <div class="border-4 border-b-[#11101e] mt-1 mb-5"></div>
            </div>

            <!-- Invoice Details and Banking Details -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">

              <!-- Invoice Details -->
              <div>
                <div class="text-2xl font-bold">{{invoice.name}} Details</div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> {{invoice.name}} #: </span>
                  <FormKit type="text" name="invoice_number" validation="required" v-model="invoice.invoice_nr" :value="invoice.invoice_nr" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-12 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
                </div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> {{invoice.name}} Date: </span>
                  <FormKit type="date" name="invoice_date" validation="required" v-model="invoice.invoice_date" :value="invoice.invoice_date" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-5 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
                </div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> {{invoice.name}} Due: </span>
                  <FormKit type="date" name="invoice_due_date" validation="required" v-model="invoice.invoice_due_date" :value="invoice.invoice_due_date"  input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-6 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
                </div>
                <div class="text-lg flex font-bold mt-2">
                  <span class="flex justify-items-center items-center"> Balance Due: </span>
                  <FormKit type="text" name="invoice_subtotal" validation="required" v-model="invoice.subtotal" :value="invoice.subtotal" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
                </div>
              </div>

              <!-- Banking Details -->
              <div>
                <div class="text-2xl font-bold">Banking Details</div>
                <div class="text-lg">Name: <span class="ml-20">{{invoice.banking.account_name}}</span></div>
                <div class="text-lg">Bank Name: <span class="ml-10">{{invoice.banking.bank}}</span></div>
                <div class="text-lg">Account #: <span class="ml-12">{{invoice.banking.account_number}}</span></div>
                <div class="text-lg">Account Type: <span class="ml-6">{{invoice.banking.account_type}}</span></div>
                <div class="text-lg">Branch Code: <span class="ml-8">{{invoice.banking.branch_code}}</span></div>
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-5"></div>

            <!-- Billed To -->
            <div class="">
              <div class="text-2xl font-bold">Billed To <span class="text-sm text-blue-600 underline cursor-pointer" @click="modalOpen = true">click here to select different job</span></div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-10">Name: </span>
                <FormKit type="text" name="customer_name" validation="required" v-model="invoice.customer.name" :value="invoice.customer.name" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-6">Address: </span>
                <FormKit type="text" name="customer_address" validation="required" v-model="invoice.customer.address" :value="invoice.customer.address" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-9">Phone: </span>
                <FormKit type="text" name="customer_phone" validation="required" v-model="invoice.customer.phone" :value="invoice.customer.phone" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-14">VAT: </span>
                <FormKit type="text" name="customer_vat" v-model="invoice.customer.vat" :value="invoice.customer.vat" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-20"></div>

            <!-- Line Items Heading -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
              <div class="text-lg font-bold col-span-8">Item</div>
              <div class="text-lg font-bold text-center">Unit Cost</div>
              <div class="text-lg font-bold text-center">Quantity</div>
              <div class="text-lg font-bold text-center">Total</div>
              <div class="text-lg font-bold text-center">Action</div>
            </div>

            <!-- Line Items -->
            <div v-for="item, index in invoice.items" :key="index" class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
              <div class="text-lg col-span-8 pb-2">
                {{item.name || item.item}}
                <p class="text-sm">{{item.description}}</p>
              </div>
              <div class="text-lg text-center content-center">{{invoice.company.currency_symbol + item.amount}}</div>
              <div class="text-lg text-center content-center">{{item.quantity}}</div>
              <div class="text-lg text-center content-center">{{invoice.company.currency_symbol + (Number(item.amount) * Number(item.quantity))}}</div>  
              <div class="text-lg flex justify-items-center items-center"><svg class="project-delete ml-10" color="hsl(232, 23%, 61%)" viewBox="0 0 1024 1024" style="stroke: currentcolor; fill: currentcolor" @click="deleteItem(index)" > <path d="M837.312 227.584v682.624c0 62.848-50.88 113.792-113.728 113.792h-455.168c-62.81 0-113.728-50.918-113.728-113.728 0-0.023 0-0.045 0-0.068l-0 0.004v-682.624h682.624zM638.272 0l56.832 56.896h199.104v113.792h-796.416v-113.792h199.040l57.024-56.896h284.416z" ></path> </svg></div>          
            </div>

            <!-- Add Line Item -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
              <div class="text-md col-span-8 pb-2">
                <FormKit :type="autocomplete" :options="searchLineItems" name="item_name" placeholder="Line Item Name" v-model="lineItem.name" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-0 w-full', inner: { $reset: true, 'relative p-0 m-0': true } }" />
                <p class="text-sm mt-2 ml-0">
                  <FormKit type="text" name="item_description" placeholder="Line Item Description" v-model="lineItem.description" :value="lineItem.description" input-class="p-1 m-0 bg-slate-100 ml-0" :classes="{ outer: 'mb-0 ml-0 w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
                </p>
              </div>
              <div class="text-md text-center content-center">
                <FormKit type="text" name="item_amount" validation="required" v-model="lineItem.amount" :value="lineItem.amount" input-class="p-1 m-0 bg-slate-100 w-full text-center" :classes="{ outer: 'mb-0 ml-0 w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-md text-center content-center">
                <FormKit type="text" name="item_quantity" validation="required" v-model="lineItem.quantity" :value="lineItem.quantity" input-class="p-1 m-0 bg-slate-100 w-full text-center" :classes="{ outer: 'mb-0 ml-0 w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-md text-right content-center">
                <FormKit type="text" name="item_total" validation="required" v-model="lineItemTotal" :value="lineItemTotal" input-class="p-1 m-0 bg-slate-100 w-full text-center" :classes="{ outer: 'mb-0 ml-0 w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div> 
              <div class="text-md text-center content-center">
                <span class="symbol" @click="addItem">+</span>
              </div>           
            </div> 

           <!-- Notes -->
           <div class="mt-10">
              <div class="text-2xl font-bold">Notes:</div>
              <div class="text-lg mt-2 max-w-xl">
                <span class="mr-10">
                  <FormKit type="textarea" name="notes" v-model="invoice.notes" :value="invoice.notes" input-class="p-1 m-0 bg-slate-100 w-full text-center" :classes="{ outer: 'mb-0 ml-0 float-right w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
                </span>
              </div>              
            </div>
            
            <!-- Sub Totals -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 mt-10">
              <div class="text-lg font-bold col-span-9"></div>
              <div class="text-lg text-left col-span-2">Subtotal</div>
              <div class="text-lg text-right">{{invoice.company.currency_symbol + (Number(invoice.subtotal) + Number(invoice.paid))}}</div>
            </div>

            <!-- Paid To Date -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2">
              <div class="text-lg font-bold col-span-9"></div>
              <div class="text-lg text-left col-span-2">Paid To Date</div>
              <div class="text-lg text-right">{{invoice.company.currency_symbol + invoice.paid}}</div>
            </div>

            <!-- Balance Due  -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2">
              <div class="text-lg font-bold col-span-9"></div>
              <div class="text-lg font-bold col-span-2 text-left">Balance Due</div>
              <div class="text-lg font-bold text-right">{{invoice.company.currency_symbol + invoice.subtotal}}</div>
            </div>

            <div class="mt-20 mb-20 text-center">
              <FormKit type="text" name="customer_due_note" validation="required" value="Thank you for your business, your payment is due within 1 day. Use the Invoice # as your payment reference." input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-1/3 ml-auto mr-auto text-center', inner: { $reset: true, 'p-0 m-0': true } }" />              
            </div>

          </div>
        </FormKit>
      </main>
    </div>
  </div>

  <div id="modalOpen" tabindex="-1" :class="{ flex: modalOpen, hidden: !modalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Select Job
          </h3>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="job" submit-label="Add" @submit="updateJob" :actions="false" >
            <FormKit type="select" validation="required" v-model="selectedJob" name="job" :options="jobsData" placeholder="Select Job" outer-class="text-left"  />
            <FormKit type="submit" label="Select Job" />
          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>


<style scoped>
  [data-invalid] .formkit-inner {
    border-color: red;
    box-shadow: 0 0 0 1px red;
  }
  [data-complete] .formkit-inner {
    border-color: none;
    border: none;
    box-shadow: none;
  }
  .formkit-inner .formkit-inner {
    box-shadow: none !important;
  }  
  .detail {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    border: 7px solid #11101e;
  }
  .project-delete {
    width: 20px;
    cursor: pointer;
  }
  .symbol {
    color: white;
    background-color: #262849;
    font-size: 30px;
    line-height: 23px;
    font-weight: 800;
    width: 30px;
    height: 30px;
    display: block;
    border-radius: 20px;
    text-align: center;
    margin: 0 auto;
    cursor: pointer;
  }
  .project-delete:hover {
    color: rgb(255, 86, 86);
  }
  .link {
    text-decoration: none;
  }
  .back-icon {
    width: 10px;
    height: 10px;
  }
  .back-text {
    color: white;
    font-weight: 700;
    margin-left: 20px;
  }
  .status-container {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: #11101e;
    margin: 5px;
    color: #fff;
  }
  .status-title {
    font-weight: 600;
    flex-basis: 60px;
  }
  .status-body {
    width: 105px;
    padding: 13px 0 13px 30px;
    border-radius: 6px;
    font-weight: 700;
    display: flex;
    align-items: center;
    position: relative;
  }
  .status-circle {
    font-size: 40px;
    position: absolute;
    left: 15px;
    top: -14px;
    line-height: 1.25;
  }
  .draft {
    background-color: #292c45;
    color: rgb(224, 228, 251);
  }
  .pending {
    background-color: rgba(255, 145, 0, 0.06);
    color: rgb(255, 145, 0);
  }
  .paid {
    background-color: rgba(51, 215, 160, 0.06);
    color: rgb(51, 215, 160);
  }
  .btn-container {
    margin-left: auto;
  }
  .btn {
    padding: 16px 24px;
    border: none;
    border-radius: 24px;
    color: white;
    font-weight: 700;
    cursor: pointer;
  }
  .btn-edit {
    background-color: #252946;
    margin-left: auto;
  }
  .btn-edit:hover {
    background-color: #1b1d32;
  }
  .btn-delete {
    background-color: #ec5555;
    margin-left: 10px;
  }
  .btn-delete:hover {
    background-color: #fb999a;
  }
  .btn-mark {
    background-color: #7b5cfa;
    margin-left: 10px;
  }
  .btn-mark:hover {
    background-color: #9175ff;
  }
  .details {
    padding: 20px 30px;
    display: grid;
    background-color: #1e2238;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    border-radius: 8px;
  }
  .project-info {
    grid-column-start: 1;
    grid-column-end: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .project-id {
    font-size: 16px;
    font-weight: 700;
  }
  .date-body,
  .due-body,
  .name-body,
  .mail-body {
    font-size: 15px;
    font-weight: 700;
  }
  .adress {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    grid-column-start: 3;
    grid-column-end: 4;
  }
  .date {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 1;
    grid-column-end: 2;
    gap: 10px;
  }
  .name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 2;
    grid-column-end: 3;
    gap: 10px;
  }
  .mail {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 3;
    grid-column-end: 4;
    gap: 10px;
  }
  .due {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    grid-column-start: 1;
    grid-column-end: 2;
    gap: 10px;
  }
  .client-adress {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    grid-column-start: 2;
    grid-column-end: 3;
  }
  .item-container {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 4;
    grid-row-end: 5;
    padding: 20px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background-color: #252946;
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
    row-gap: 20px;
  }
  .project-item {
    grid-column-start: 1;
    grid-column-end: 5;
    display: grid;
    grid-template-columns: 2fr repeat(3, 1fr);
  }
  .prj-text {
    font-weight: 700;
  }
  .amount {
    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 5;
    grid-row-end: 6;
    padding: 20px 70px 20px 20px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    background-color: #0d0e17;
    margin-top: -20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .amount-number {
    font-size: 20px;
    font-weight: 700;
  }

  @media screen and (max-width: 1024px) {
    .detail {
      padding: 100px 120px 20px 120px;
    }
  }

  @media screen and (max-width: 750px) {
    .detail {
      padding: 100px 20px 20px 20px;
    }
  }
</style>
