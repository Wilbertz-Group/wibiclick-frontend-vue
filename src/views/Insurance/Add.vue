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
import imageHolder from '@/helpers/logo.js'

const loading = ref(false);
const all_contacts = ref();
const contact = ref();
const profile = ref(false);
const selectedContact = ref();
const dbContacts = ref({job: 'Select Job'});
const toast = useToast();
const router = useRouter();
const route = useRoute()
const modalOpen = ref(false)

const userStore = useUserStore();

const insurance = ref({
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
  notes: "",
  status: "sent",
	name: "Insurance Report",
	insurance_nr: 1,
	insurance_date: moment().format('YYYY-MM-DD'),
	insurance_due_date: moment().add(3, 'days').format('YYYY-MM-DD'),  
});

async function checkParams() {
  if( !route.query?.job_id ){   
    toast.warning("Contact id is required to create an insurance report")
    getContacts()
  }
  
  if( route.query?.contact_id ){ 
    try {
      loading.value = true
      const response = await axios.get(`customers?id=${userStore.currentWebsite}&limit=1000&offset=0`);

      let contacts = {};

      for (const contact of response.data.customers) {
        contacts[contact.id] = contact.name
      }

      dbContacts.value = contacts
      all_contacts.value = response.data.customers

      updateInsurance({contact: route.query?.contact_id})

      loading.value = false
    } catch (error) {
      console.log(error)
      loading.value = false
      toast.error("Error getting contacts data")
    }
    
  }
} 

async function getContacts() {
  try {
    loading.value = true
    const response = await axios.get(`customers?id=${userStore.currentWebsite}&limit=1000&offset=0`);

    let contacts = {};

    for (const contact of response.data.customers) {
      contacts[contact.id] = contact.name
    }

    dbContacts.value = contacts
    all_contacts.value = response.data.customers

    loading.value = false
    modalOpen.value = true
  } catch (error) {
    console.log(error)
    loading.value = false
    modalOpen.value = true
    toast.error("Error getting contacts data")
  }
}

async function updateInsurance(data){
  let contact_data = all_contacts.value.filter(e => { return e.id == data.contact })[0]
  contact.value = contact_data;

  if(!profile.value){
    try {
      loading.value = true
      const response = await axios.get('profile?id='+ userStore.currentWebsite);
      profile.value = response.data
      loading.value = false
    } catch (error) {
      console.log(error)
      toast.warning("Failed to get profile data")
      loading.value = false
    }
  }

  let insurance_number = 0;

  try {
    loading.value = true
    const response = await axios.get('insurance_report_number?id='+ userStore.currentWebsite);
    insurance_number = response.data.insurance_number
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.warning("Failed to get insurance number")
    loading.value = false
  }

  insurance.value = {
    company: profile.value.company,
    customer: {
      id: contact_data.id,
      name: contact_data.name,
      address: contact_data.address,
      phone: contact_data.phone,
      vat: "",
    },
    notes: "",
    status: "sent",
    name: "Insurance Report",
    insurance_nr: insurance_number + 1,
    insurance_date: moment().format('YYYY-MM-DD'),
    insurance_due_date: moment().add(3, 'days').format('YYYY-MM-DD'),
  }
  modalOpen.value = false
}

async function saveInsurance(data) {
  let insurance_number = 0;

  if(!profile.value){
    try {
      loading.value = true
      const response = await axios.get('profile?id='+ userStore.currentWebsite);
      profile.value = response.data
      loading.value = false
    } catch (error) {
      console.log(error)
      toast.warning("Failed to get profile data")
      loading.value = false
    }
  }

  try {
    loading.value = true
    const response = await axios.get('insurance_report_number?id='+ userStore.currentWebsite);
    insurance_number = response.data.insurance_number
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.warning("Failed to get insurance number")
    loading.value = false
  }

  let payload = {
    status: insurance.value.status,
    name: insurance.value.name,
    number: insurance_number + 1,
    issuedAt: moment(insurance.value.insurance_date,).toISOString(),
    dueAt: moment(insurance.value.insurance_due_date,).toISOString(),
    notes: insurance.value.notes,
    customerId: insurance.value.customer.id
  }

  try {
    loading.value = true
    const response = await axios.post('add-insurance-report?id='+ userStore.currentWebsite, payload);
    toast.success(response.data.message)
    loading.value = false
    modalOpen.value = false
    //router.push({ name: 'insurance-reports' })
  } catch (error) {
    console.log(error)
    loading.value = false
  }

  function createinsurance(insurance, path) {
    let doc;

    try {
      doc = new PDFDocument({ size: "A4", margin: 50 });
    } catch (error) {
      toast.error("Failed failed to initialize the pdf generation, Reload you page and try again!!")
    }

    // pipe the document to a blob
    const stream = doc.pipe(blobStream());

    // add your content to the document here, as usual
    generateHeader(doc, insurance);
    generateCustomerInformation(doc, insurance);
    generateNotes(doc, insurance);
    generateFooter(doc);

    doc.end();

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    let blob;

    function download() {
      if (!blob) return;
      toast.success("Downloading your Insurance")
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = path;
      a.click();
      window.URL.revokeObjectURL(url);
      //router.push({ name: 'insurance-reports' })
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

  let img, notestart;
  
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
      createinsurance(insurance.value, insurance.value.customer.name + '.pdf');
    };

    xhr.send();    
  } catch (error) {
    img = imageHolder
    createinsurance(insurance.value, insurance.value.customer.name + '.pdf');
  }

  function generateHeader(doc, insurance) {
    doc
      .image(img, 50, 45, { width: 50 })
      // .image("lg.png", 50, 45, { width: 50 })
      .fillColor("#444444")
      .fontSize(14)
      .text(insurance.company.name, 110, 57)		
      .fontSize(10)
      .text(insurance.company.slogan, 110, 75)
      .text(insurance.company.name, 200, 50, { align: "right" })
      .text(insurance.company.address1, 200, 65, { align: "right" })
      .text(insurance.company.address2 + " " + insurance.company.city, 200, 80, { align: "right" })
      .text(insurance.company.state + ", " + insurance.company.country, 200, 95, { align: "right" })
      .text(insurance.company.postal_code, 200, 110, { align: "right" })
      .text("Email: "+insurance.company.email, 200, 130, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, insurance) {
    doc.fillColor("#444444").fontSize(20).text("Insurance Report", 50, 160);

    generateHr(doc, 185);

    //Issued to
    let billed_to = 200
    doc	
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("Issued to:", 50, billed_to)
    .fontSize(11)
    .font("Helvetica")
    .text("Name:", 50, billed_to + 15)
    .text(insurance.customer.name, 130, billed_to + 15)
    .text("Address:", 50, billed_to + 30)
    .text(insurance.customer.address, 130, billed_to + 30)
    .text("Phone:", 50, billed_to + 45)
    .text(insurance.customer.phone, 130, billed_to + 45)
    .text("VAT:", 50, billed_to + 60)
    .text(insurance.customer.vat, 130, billed_to + 60)
    .moveDown();

    notestart = billed_to + 90
  }

  function generateNotes(doc, insurance) {
    if(insurance.notes){
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Report Details:", 50, notestart + 10, "Report Details")
        .fontSize(11)
        .font("Helvetica")
        .text(
          insurance.notes,
          50,
          notestart + 30,
          { align: "left", width: 500 }
        );
    }
  }

  function generateFooter(doc) {
    doc
      .fontSize(10)
      .text(
        "Thank you for your business.",
        50,
        780,
        { align: "center", width: 500 }
      );
  }

  function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
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

})

</script>

<template>
  <Header title="Add a new insurance report" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
        <FormKit
          type="form"
          id="edit"
          :form-class="submitted ? 'hide' : 'show'"
          submit-label="Update"
          @submit="saveInsurance"
          :actions="false"
          
        >
          <div class="status-container">
            <p class="status-title">Status</p>
            <FormKit 
              type="select" 
              v-model="insurance.status" 
              name="insurance_status" 
              :options="['sent', 'accepted', 'rejected']" 
              outer-class="status-body text-left mb-0"  
              inner-class="border-none focus-within:border-none shadow-none focus-within:shadow-none"  
              input-class="bg-[#0275ff] text-white m-0"
            />

            <div class="btn-container">
              <FormKit type="submit" @click="save_type = 'download'" class="btn btn-mark" outer-class="mb-0" label="Save & Download" suffix-icon="download" />
            </div>
          </div>

          <div class="pl-5 pr-10 pt-5">
            <!-- Insurance Header -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
              <div class="flex items-center">
                <img src="@/assets/images/lg.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Insurance Logo">
                <div>
                  <h3 class="text-3xl">{{ insurance.company.name }}</h3> 
                  <h3 class="text-xl">{{ insurance.company.slogan }}</h3> 
                </div>
              </div> 
              <div class="text-right">
                <div class="text-lg">{{insurance.company.name}}</div>
                <div class="text-lg">{{insurance.company.address1}}</div>
                <div class="text-lg">{{insurance.company.address2 + " " + insurance.company.city}}</div>
                <div class="text-lg">{{insurance.company.state + ", " + insurance.company.country}}</div>
                <div class="text-lg">{{insurance.company.postal_code}}</div>
                <div class="text-lg">Email: {{insurance.company.email}}</div>
              </div>
            </div>

            <!-- Insurance Sub-Header -->
            <div>
              <div class="text-5xl mt-10">
                <FormKit 
                  type="text" 
                  name="insurance_title" 
                  validation="required" 
                  :value="insurance.name" 
                  :classes="{ outer: 'p-1 bg-slate-100 text-5xl', inner: { $reset: true } }" 
                  input-class="p-0 m-0 text-5xl"
                />
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-5"></div>

            <!-- Issued to -->
            <div class="">
              <div class="text-2xl font-bold">Issued to <span class="text-sm text-blue-600 underline cursor-pointer" @click="modalOpen = true">click here to select different contact</span></div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-10">Name: </span>
                <FormKit type="text" name="customer_name" validation="required" v-model="insurance.customer.name" :value="insurance.customer.name" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-6">Address: </span>
                <FormKit type="text" name="customer_address" validation="required" v-model="insurance.customer.address" :value="insurance.customer.address" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-9">Phone: </span>
                <FormKit type="text" name="customer_phone" validation="required" v-model="insurance.customer.phone" :value="insurance.customer.phone" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
              <div class="text-lg flex font-bold mt-2">
                <span class="flex justify-items-center items-center mr-14">VAT: </span>
                <FormKit type="text" name="customer_vat" v-model="insurance.customer.vat" :value="insurance.customer.vat" input-class="p-1 m-0 bg-slate-100" :classes="{ outer: 'mb-0 ml-3 w-96', inner: { $reset: true, 'p-0 m-0': true } }" />
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-10"></div>

            <!-- Report details -->
           <div class="mt-0">
              <div class="text-2xl font-bold">Report details:</div>
              <div class="text-lg mt-2 max-w-full">
                <span class="mr-10">
                  <FormKit type="textarea" name="notes" v-model="insurance.notes" :value="insurance.notes" input-class="p-1 m-0 bg-slate-100 w-full text-left" :classes="{ outer: 'mb-0 ml-0 float-right w-full', inner: { $reset: true, 'p-0 m-0': true } }" />
                </span>
              </div>              
            </div>

            <div class="mt-20 mb-20 text-center">
              <FormKit type="text" name="customer_due_note" validation="required" value="Thank you for your business." input-class="p-1 m-0 bg-slate-100 text-center" :classes="{ outer: 'mb-0 ml-3 w-1/3 ml-auto mr-auto text-center', inner: { $reset: true, 'p-0 m-0 text-center': true } }" />              
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
            Select Contact
          </h3>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="contact" submit-label="Add" @submit="updateInsurance" :actions="false" >
            <FormKit type="select" v-model="selectedContact" name="contact" :options="dbContacts" placeholder="Select Contact" outer-class="text-left" validation="required" />
            <FormKit type="submit" label="Select Contact" />
          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>

<style scoped>
  .formkit-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 15em;
    background-color: white;
    box-shadow: 0 0 0.5em rgb(0 0 0 / 10%);
    margin: 0;
    padding: 0;
    list-style-type: none;
    overflow: hidden;
    border-radius: 0.25em;
  }
  .formkit-dropdown-item {
    padding: 0.5em;
    border-bottom: 1px solid #e4e4e4;
  }
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
