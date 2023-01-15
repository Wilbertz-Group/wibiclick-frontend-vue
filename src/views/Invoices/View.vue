<script setup>
import imageHolder from '../../helpers/logo.js'
import { getBase64FromUrl, generateTableRow } from '../../helpers/index.js'
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watchEffect } from "vue";
import { useToast } from "vue-toast-notification";
import { useRoute, useRouter } from "vue-router";
import { computed } from "@vue/reactivity";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

const loading = ref(false);
const invoiceData = ref({});
const all_invoices = ref();
const profile = ref(false);
const selectedJob = ref();
const invoicesData = ref({invoice: 'Select Invoice'});
const toast = useToast();
const router = useRouter();
const route = useRoute()
const modalOpen = ref(false)
const save_type = ref()
 
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
  status: "",
	name: "",
  notes: "",
	invoice_nr: "",
	invoice_date: "",
	invoice_due_date: "",  
});

const lineItem = ref({
  name: '',
  description: '',
  amount: 1,
  quantity: 1,
})

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

async function fetchInvoices() {
  try {
    loading.value = true
    const response = await axios.get(
      `invoices?id=${userStore.currentWebsite}&limit=1500&offset=0`
    );

    all_invoices.value = response.data.invoices
    let invoices = {};

    for (const invoice of response.data.invoices) {
      invoices[invoice.id] = invoice.name
    }

    invoicesData.value = invoices
    loading.value = false
    route.query.invoice_id ? updateInvoice({invoice: route.query.invoice_id}) : ''
  } catch (error) {
    console.log(error);
    loading.value = false
    toast.error("Error getting invoices data")
  }
}

async function updateInvoice(data){
  let invoice_data = all_invoices.value.filter(e => { return e.id == data.invoice })[0]
  invoiceData.value = invoice_data

  if(!profile.value){
    try {
      loading.value = true
      modalOpen.value = false
      const response = await axios.get('profile?id='+ userStore.currentWebsite);
      profile.value = response.data
      loading.value = false
      modalOpen.value = true
    } catch (error) {
      console.log(error)
      toast.warning("Failed to get Company Data")
      loading.value = false
      modalOpen.value = true
    }
  }

  invoice.value = {
    company: profile.value.company,
    customer: {
      id: invoiceData.value.customer?.id,
      name: invoiceData.value.customer?.name,
      address: invoiceData.value.job?.address,
      phone: invoiceData.value.job?.phone,
      vat: "",
    },
    banking: profile.value.banking,
    items: invoiceData.value.lineItem,
    subtotal: invoiceData.value.sales,
    paid: Number(invoiceData.value.deposit) || 0,
    status: invoiceData.value.reason,
    notes: invoiceData.value.notes,
    name: invoiceData.value.name,
    invoice_nr: invoiceData.value.number,
    invoice_date: moment(invoiceData.value.issuedAt).format('YYYY-MM-DD'),
    invoice_due_date: moment(invoiceData.value.invoice_due_date).add(1, 'days').format('YYYY-MM-DD'),
  }
  modalOpen.value = false
}

async function saveInvoice(data) {

  function createInvoice(invoice, path) {
    let doc = new PDFDocument({ size: "A4", margin: 50 });

    // pipe the document to a blob
    const stream = doc.pipe(blobStream());

    // add your content to the document here, as usual
    generateHeader(doc, invoice);
    generateCustomerInformation(doc, invoice);
    generateInvoiceTable(doc, invoice);
    generateNotes(doc, invoice);
    generateFooter(doc);
    //generateBorder(doc);

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
      //router.push({ name: 'invoices' })
    }

    stream.on("finish", function() {
      // get a blob you can do whatever you like with
      blob = stream.toBlob("application/pdf");
      download();
    });

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
        createInvoice(invoice.value, invoice.value.customer.name + '.pdf');
      };

      xhr.send();    
  } catch (error) {
    img = imageHolder
    createInvoice(invoice.value, invoice.value.customer.name + '.pdf');
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
      .text(invoice.invoice_nr, invoiceSpace, customerInformationTop + 15)		
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
  
}

async function checkParams() {
  if( route.query.invoice_id ){    
    toast.success("You have successfully selected an invoice to edit")
    fetchInvoices()    
  } else {
    toast.warning("Please select an invoice to edit")
    fetchInvoices()
    modalOpen.value = true
  }
} 

onMounted(()=>{
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
  <Header title="View invoice" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
          <div class="grid gap-3 text-right lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 mt-5">
            <div><h2 class="text-md font-semibold text-left ml-5">STATUS: {{invoice.status}}</h2> </div>
            <div class="relative text-right">
              <router-link :to="{name: 'edit-invoice', query:{ invoice_id: route.query.invoice_id }}" class="text-white inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="w-6 h-6 inline pb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Edit Invoice</router-link> 
              
              <div @click="saveInvoice()" class="text-white cursor-pointer inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download</div>
            </div>
          </div> 

          <div class="pl-5 pr-10 pt-5">
            <!-- Invoice Header -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
              <div class="flex items-center">
                <img id="tux" crossOrigin="anonymous" src="@/assets/images/lg.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Invoice Logo">
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
                <span class="p-2">Invoice</span>
              </div>
              <div class="border-4 border-b-[#11101e] mt-1 mb-5"></div>
            </div>

            <!-- Invoice Details and Banking Details -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">

              <!-- Invoice Details -->
              <div>
                <div class="text-2xl font-bold">Invoice Details</div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> Invoice #: {{invoice.invoice_nr}}</span>
                </div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> Invoice Date: {{invoice.invoice_date}}</span>
                </div>
                <div class="text-lg flex mt-2">
                  <span class="flex justify-items-center items-center"> Invoice Due: {{invoice.invoice_due_date}}</span>
                </div>
                <div class="text-lg flex font-bold mt-2">
                  <span class="flex justify-items-center items-center"> Balance Due: {{invoice.subtotal}}</span>
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
              <div class="text-2xl font-bold">Billed To</div>
              <div class="text-lg flex mt-2">
                <span class="flex justify-items-center items-center mr-10">Name: {{invoice.customer.name}}</span>
              </div>
              <div class="text-lg flex mt-2">
                <span class="flex justify-items-center items-center mr-6">Address: {{invoice.customer.address}}</span>
              </div>
              <div class="text-lg flex mt-2">
                <span class="flex justify-items-center items-center mr-9">Phone: {{invoice.customer.phone}}</span>
              </div>
              <div class="text-lg flex mt-2">
                <span class="flex justify-items-center items-center mr-14">VAT: {{invoice.customer.vat}}</span>
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-20"></div>

            <!-- Line Items Heading -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
              <div class="text-lg font-bold col-span-9">Item</div>
              <div class="text-lg font-bold text-center">Unit Cost</div>
              <div class="text-lg font-bold text-center">Quantity</div>
              <div class="text-lg font-bold text-center">Total</div>
            </div>

            <!-- Line Items -->
            <div v-for="item, index in invoice.items" :key="index" class="grid grid-flow-col grid-rows-1 grid-cols-12 gap-4 mb-2 border-2 border-transparent border-b-[#11101e]">
              <div class="text-lg col-span-9 pb-2">
                {{item.name || item.item}}
                <p class="text-sm">{{item.description}}</p>
              </div>
              <div class="text-lg text-center content-center">{{invoice.company.currency_symbol + item.amount}}</div>
              <div class="text-lg text-center content-center">{{item.quantity}}</div>
              <div class="text-lg text-center content-center">{{invoice.company.currency_symbol + (Number(item.amount) * Number(item.quantity))}}</div>           
            </div>

            <!-- Notes -->
            <div class="">
              <div class="text-2xl font-bold mt-24">Notes:</div>
              <div class="text-lg flex mt-2 max-w-[300px]">
                <span class="flex justify-items-center items-center mr-10">{{invoice.notes}}</span>
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
              <div class="mb-0 ml-3 w-1/3 ml-auto mr-auto text-center">
                Thank you for your business, your payment is due within 1 day. Use the Invoice # as your payment reference. 
              </div>             
            </div>

          </div>
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
            Select Invoice
          </h3>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="invoice" submit-label="Add" @submit="updateInvoice" :actions="false" >
            <FormKit type="select" validation="required" v-model="selectedJob" name="invoice" :options="invoicesData" placeholder="Select Invoice" outer-class="text-left"  />
            <FormKit type="submit" label="Select Invoice" />
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
