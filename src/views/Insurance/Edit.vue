<script setup>
import imageHolder from '../../helpers/logo.js'
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watchEffect } from "vue";
import { useToast } from "vue-toast-notification";
import { useRoute, useRouter } from "vue-router";
import { computed } from "@vue/reactivity";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { getBase64FromUrl, generateTableRow } from '../../helpers/index.js'
import { autocomplete } from "@/helpers/custom-input.js"

const job = ref();
const selectedJob = ref();
const loading = ref(false);
const insuranceData = ref({});
const all_insurances = ref();
const profile = ref(false);
const insurancesData = ref({insurance: 'Select Insurance'});
const toast = useToast();
const router = useRouter();
const route = useRoute()
const modalOpen = ref(false)
const save_type = ref()

const userStore = useUserStore();

const status = ref();

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
  status: "sent",
	name: "Insurance Report",
  notes: "",
	insurance_nr: "",
	insurance_date: "",
	insurance_due_date: "",  
});

async function fetchinsurances() {
  try {
    loading.value = true
    const response = await axios.get(
      `insurance-reports?id=${userStore.currentWebsite}&limit=1500&offset=0`
    );

    all_insurances.value = response.data.insurance
    let insurances = {};

    for (const insurance of response.data.insurance) {
      insurances[insurance.id] = insurance.name
    }

    insurancesData.value = insurances
    loading.value = false
    route.query.insurance_id ? updateinsurance({insurance: route.query.insurance_id}) : ''
  } catch (error) {
    console.log(error);
    loading.value = false
    toast.error("Error getting insurance reports data")
  }
}

async function updateinsurance(data){
  let insurance_data = all_insurances.value.filter(e => { return e.id == data.insurance })[0]
  insuranceData.value = insurance_data

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

  insurance.value = {
    company: profile.value.company,
    customer: {
      id: insurance_data.customer?.id,
      name: insurance_data.customer?.name,
      address: insurance_data.customer?.address,
      phone: insurance_data.customer?.phone,
      vat: "",
    },
    notes: insurance_data.notes,
    status: insurance_data.status,
    name: insurance_data.name,
    insurance_nr: insurance_data.number,
    insurance_date: moment(insurance_data.issuedAt).format('YYYY-MM-DD'),
    insurance_due_date: moment(insurance_data.insurance_due_date).add(1, 'days').format('YYYY-MM-DD'),
  }
  modalOpen.value = false
}

async function saveInsuranceOnly(data) {
  toast.success("Saving Only")
  let payload = {
    id: insuranceData.value.id,
    status: data.insurance_status,
    name: insurance.value.name,
    number: data.insurance_number,
    issuedAt: moment(data.insurance_date).toISOString(),
    notes: data.notes,
    customerId: insuranceData.value.customer?.id,
    employeeId: insuranceData.value.employee?.id || "",
    websiteId: insuranceData.value.website?.id,
    items: insurance.value.items
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
}

async function saveinsurance(data) {
  if( save_type.value == 'save' ){
    saveInsuranceOnly(data)
    return
  }

  let payload = {
    id: insuranceData.value.id,
    status: data.insurance_status,
    name: insurance.value.name,
    number: data.insurance_number,
    issuedAt: moment(data.insurance_date).toISOString(),
    notes: data.notes,
    customerId: insuranceData.value.customer?.id,
    employeeId: insuranceData.value.employee?.id || '',
    websiteId: insuranceData.value.website?.id,
    items: insurance.value.items
  }

  try {
    loading.value = true
    const response = await axios.post('add-insurance-report?id='+ userStore.currentWebsite, payload);
    toast.success(response.data.message)
    loading.value = false
    modalOpen.value = false    
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
    //generateBorder(doc);

    doc.end();

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    let blob;

    function download() {
      if (!blob) return;
      toast.success("Downloading your Insurance Report")
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = path;
      a.click();
      window.URL.revokeObjectURL(url);
      //router.push({ name: 'insurances' })
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

async function checkParams() {
  if( route.query.insurance_id ){    
    toast.success("You have successfully selected an insurance report to edit")
    fetchinsurances()    
  } else {
    toast.warning("Please select an insurance report to edit")
    fetchinsurances()
    modalOpen.value = true
  }
} 

onMounted(()=>{
  status.value = userStore.status
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
  <Header title="Edit insurance report" />
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <main class="detail">
        <FormKit
          type="form"
          id="edit"
          :form-class="submitted ? 'hide' : 'show'"
          submit-label="Update"
          @submit="saveinsurance"
          :actions="false"
          
        >

        <div class="grid gap-3 text-right lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 mt-5 w">
            <div class="relative text-left"> 
              <FormKit
                type="select"
                name="insurance_status"
                v-model="insurance.status"
                outer-class="text-white ml-2 mb-0 w-36 bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80" 
                input-class="font-medium text-sm m-0 text-white border-none focus-within:border-none"
              >
                <optgroup label="Select Status" class="text-gray-800 text-lg">
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </optgroup>
              </FormKit>

            </div> 

            <div class="relative text-right"> 
              <button type="submit" @click="save_type = 'save'" class="text-white inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="w-6 h-6 inline pb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Save</button> 
              
              <button type="submit" @click="save_type = 'download'" class="text-white cursor-pointer inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download</button>

            </div>
          </div> 

          <div class="pl-5 pr-10 pt-5">
            <!-- Insurance Header -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
              <div class="flex items-center">
                <img id="tux" crossOrigin="anonymous" src="@/assets/images/lg.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Insurance Logo">
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
                  value="Insurance Report" 
                  :classes="{ outer: 'p-1 bg-slate-100', inner: { $reset: true } }" 
                  input-class="p-0 m-0 text-5xl"
                />
              </div>
            </div>

            <div class="border-4 border-b-[#11101e] mt-5 mb-5"></div>

            <!-- Issued to -->
            <div class="">
              <div class="text-2xl font-bold">Issued to <span class="text-sm text-blue-600 underline cursor-pointer" @click="changeJob">click here to select different job</span></div>
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

            <!-- Report Details -->
            <div class="mt-5 mb-24">
              <div class="text-2xl font-bold">Report Details: </div>
              <div class="text-lg mt-2 max-w-full">
                <span class="mr-10">
                  <FormKit type="textarea" name="notes" v-model="insurance.notes" :value="insurance.notes"  input-class="p-1 m-0 bg-slate-100 w-full text-left" :classes="{ outer: 'mb-0 ml-0 float-right w-full', inner: { $reset: true, 'p-0 m-0': true } }" />

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
            Select Insurance
          </h3>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="insurance" submit-label="Add" @submit="updateinsurance" :actions="false" >
            <FormKit type="select" validation="required" v-model="selectedJob" name="insurance" :options="insurancesData" placeholder="Select Insurance" outer-class="text-left"  />
            <FormKit type="submit" label="Select Insurance" />
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
