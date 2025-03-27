<script setup>
import imageHolder from '../../helpers/logo.js'
import axios from "axios";
import moment from 'moment'
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, watchEffect } from "vue";
import TipTapEditor from "@/components/editor/TipTapEditor.vue"; // Import TipTapEditor
import { useToast } from "vue-toast-notification";
import { useRoute, useRouter } from "vue-router";
import { computed } from "@vue/reactivity";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { getBase64FromUrl, generateTableRow } from '../../helpers/index.js'
import { autocomplete } from "@/helpers/custom-input.js"
import modal from "@/components/misc/modalInsuranceAttachment.vue"
import FormData from 'form-data';

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

const blob = ref();
const isOpen = ref(false)
const client = ref(insurance.value.customer.name) 
const sender = ref(profile.value.firstName) 
const company = ref(profile.value?.company?.company_name)

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
      // Use dynamic positioning for address lines to prevent overlap
      .fontSize(10)
      .text(insurance.company.name, 200, 50, { align: "right" })
      
      // Calculate positions dynamically based on text height
      let yPos = 65;
      
      // Address line 1
      doc.text(insurance.company.address1, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(insurance.company.address1, { width: 350, align: "right" }) + 5;
      
      // Address line 2 with city
      const addressLine2 = insurance.company.address2 + " " + insurance.company.city;
      doc.text(addressLine2, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(addressLine2, { width: 350, align: "right" }) + 5;
      
      // State and country
      const stateCountry = insurance.company.state + ", " + insurance.company.country;
      doc.text(stateCountry, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(stateCountry, { width: 350, align: "right" }) + 5;
      
      // Postal code
      doc.text(insurance.company.postal_code, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(insurance.company.postal_code, { width: 350, align: "right" }) + 5;
      
      // Email
      doc.text("Email: "+insurance.company.email, 200, yPos, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, insurance) {
    doc.fillColor("#444444").fontSize(20).text("Insurance Report", 50, 160);

    generateHr(doc, 185);

    // Issued to section
    let billed_to = 200;
    let currentY = billed_to;

    doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Issued to:", 50, currentY);

    currentY += 20; // Space after "Issued to:"

    doc
        .fontSize(11)
        .font("Helvetica")
        .text("Name:", 50, currentY)
        .text(insurance.customer.name, 130, currentY);

    currentY += 20; // Space for next field

    doc.text("Address:", 50, currentY);

    // Define the maximum width for the address (assuming page width 595, margins 50)
    const addressWidth = 415; // 595 - 50 (left margin) - 130 (start x) - 50 (right margin)

    // Calculate the height of the address text with wrapping
    const addressHeight = doc.heightOfString(insurance.customer.address, { width: addressWidth });

    // Render the address with wrapping
    doc.text(insurance.customer.address, 130, currentY, { width: addressWidth });

    // Adjust currentY based on the height of the address plus some spacing
    currentY += addressHeight + 10;

    doc
        .text("Phone:", 50, currentY)
        .text(insurance.customer.phone, 130, currentY);

    currentY += 20; // Space for next field

    doc
        .text("VAT:", 50, currentY)
        .text(insurance.customer.vat, 130, currentY);

    currentY += 20; // Space for next section

    notestart = currentY; // Set the starting position for the next section
  }

  function generateNotes(doc, insurance) {
    // Exit if no notes are provided
    if (!insurance.notes) return;

    // Set the "Report Details" header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Report Details:", 50, notestart + 10);

    try {
      // Parse the HTML content from insurance.notes
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = insurance.notes;

      // Initialize positioning and layout variables
      let currentY = notestart + 30; // Start below the header
      const lineHeight = 14; // Base line height for text
      const maxWidth = 500; // Maximum text width for wrapping
      const pageHeight = 800; // Usable height of an A4 page (approx.)
      const marginBottom = 50; // Bottom margin to avoid cutting off text

      // Helper function to check and handle page breaks
      function checkPageBreak(height) {
        if (currentY + height > pageHeight - marginBottom) {
          doc.addPage();
          currentY = 50; // Reset to top of new page with margin
          return true;
        }
        return false;
      }

      // Helper function to process DOM nodes recursively
      function processNode(node, parentFont = "Helvetica", parentSize = 11, indent = 0) {
        if (node.nodeType === 3) { // Text node
          if (node.textContent.trim() !== '') {
            const text = node.textContent.trim();

            // Set font and size for text
            doc.font(parentFont).fontSize(parentSize);

            // Calculate text height for page break check
            const textHeight = doc.heightOfString(text, {
              width: maxWidth - indent,
              align: "left"
            });

            // Check for page break
            checkPageBreak(textHeight);

            // Render text with wrapping
            doc.text(text, 50 + indent, currentY, {
              width: maxWidth - indent,
              align: "left",
              lineBreak: true,
              lineGap: 2, // Small gap between lines
              wordSpacing: 0.5 // Slight word spacing for readability
            });

            currentY += textHeight + 2; // Move Y-position down
          }
        } else if (node.nodeType === 1) { // Element node
          let fontSize = parentSize;
          let font = parentFont;
          let additionalIndent = 0;

          // Apply styles based on HTML tag
          switch (node.tagName.toLowerCase()) {
            case 'strong':
            case 'b':
              font = "Helvetica-Bold";
              break;
            case 'em':
            case 'i':
              font = "Helvetica-Oblique";
              break;
            case 'h1':
              fontSize = 16;
              font = "Helvetica-Bold";
              checkPageBreak(fontSize + 5);
              currentY += 5; // Extra space before heading
              break;
            case 'h2':
              fontSize = 14;
              font = "Helvetica-Bold";
              checkPageBreak(fontSize + 4);
              currentY += 4;
              break;
            case 'h3':
              fontSize = 12;
              font = "Helvetica-Bold";
              checkPageBreak(fontSize + 3);
              currentY += 3;
              break;
            case 'p':
              checkPageBreak(lineHeight + 2);
              currentY += 2; // Space between paragraphs
              break;
            case 'ul':
            case 'ol':
              checkPageBreak(lineHeight + 5);
              currentY += 5; // Space before lists
              break;
            case 'li':
              additionalIndent = 15;
              if (!checkPageBreak(lineHeight)) {
                doc.font(font).fontSize(fontSize).text("• ", 50 + indent, currentY);
              }
              break;
            case 'br':
              checkPageBreak(lineHeight);
              currentY += lineHeight;
              break;
            case 'table':
              checkPageBreak(lineHeight + 10);
              currentY += 10; // Space for tables
              break;
            case 'tr':
            case 'td':
              additionalIndent = 5;
              break;
          }

          // Process child nodes with updated styles
          if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
              processNode(node.childNodes[i], font, fontSize, indent + additionalIndent);
            }
          } else if (node.textContent.trim() !== '') {
            const text = node.textContent.trim();
            const textHeight = doc
              .font(font)
              .fontSize(fontSize)
              .heightOfString(text, { width: maxWidth - indent - additionalIndent });

            checkPageBreak(textHeight);

            doc
              .font(font)
              .fontSize(fontSize)
              .text(text, 50 + indent + additionalIndent, currentY, {
                width: maxWidth - indent - additionalIndent,
                lineBreak: true,
                align: "left"
              });

            currentY += textHeight + 2;
          }

          // Add space after block elements
          switch (node.tagName.toLowerCase()) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'p':
            case 'ul':
            case 'ol':
            case 'table':
              if (!checkPageBreak(5)) {
                currentY += 5;
              }
              break;
          }
        }
      }

      // Process all nodes in the parsed HTML
      Array.from(tempDiv.childNodes).forEach(node => {
        processNode(node);
      });

    } catch (error) {
      console.error("Error rendering formatted text:", error);
      // Fallback to plain text if HTML parsing fails
      const plainText = insurance.notes.replace(/<[^>]*>/g, ''); // Strip HTML tags
      const textHeight = doc
        .font("Helvetica")
        .fontSize(11)
        .heightOfString(plainText, { width: 500 });

      if (notestart + 30 + textHeight > 800 - 50) {
        doc.addPage();
        doc
          .font("Helvetica")
          .fontSize(11)
          .text(plainText, 50, 50, {
            align: "left",
            width: 500,
            lineBreak: true,
            lineGap: 2,
            wordSpacing: 0.5
          });
      } else {
        doc
          .font("Helvetica")
          .fontSize(11)
          .text(plainText, 50, notestart + 30, {
            align: "left",
            width: 500,
            lineBreak: true,
            lineGap: 2,
            wordSpacing: 0.5
          });
      }
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

async function sendAttachment(data) {
  client.value = insurance.value?.customer?.name 
  sender.value = profile.value?.firstName 
  company.value = profile.value?.company?.company_name

  let payload = {
    id: insuranceData.value.id,
    status: insuranceData.value.insurance_status,
    name: insurance.value.name,
    number: insuranceData.value.insurance_number,
    issuedAt: moment(insuranceData.value.insurance_date).toISOString(),
    notes: insuranceData.value.notes,
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

    let attachment;

    stream.on("finish", function() {
      // get a blob you can do whatever you like with
      attachment = stream.toBlob("application/pdf");

      //Send to client on whatsapp
      blob.value = attachment
      isOpen.value = true
    })

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
      // Use dynamic positioning for address lines to prevent overlap
      .fontSize(10)
      .text(insurance.company.name, 200, 50, { align: "right" })
      
      // Calculate positions dynamically based on text height
      let yPos = 65;
      
      // Address line 1
      doc.text(insurance.company.address1, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(insurance.company.address1, { width: 350, align: "right" }) + 5;
      
      // Address line 2 with city
      const addressLine2 = insurance.company.address2 + " " + insurance.company.city;
      doc.text(addressLine2, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(addressLine2, { width: 350, align: "right" }) + 5;
      
      // State and country
      const stateCountry = insurance.company.state + ", " + insurance.company.country;
      doc.text(stateCountry, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(stateCountry, { width: 350, align: "right" }) + 5;
      
      // Postal code
      doc.text(insurance.company.postal_code, 200, yPos, { align: "right" });
      yPos += doc.heightOfString(insurance.company.postal_code, { width: 350, align: "right" }) + 5;
      
      // Email
      doc.text("Email: "+insurance.company.email, 200, yPos, { align: "right" })
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
      // Set initial styles
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Report Details:", 50, notestart + 10, "Report Details");

      try {
        // Use a more robust approach to handle HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = insurance.notes;
        
        // Process the HTML content
        let currentY = notestart + 30;
        const lineHeight = 14; // Base line height
        const maxWidth = 500; // Maximum width for text
        const pageHeight = 800; // Approximate usable height of A4 page
        const marginBottom = 50; // Bottom margin to avoid cutting off text
        
        // Helper function to check if we need a page break
        function checkPageBreak(height) {
          if (currentY + height > pageHeight - marginBottom) {
            doc.addPage();
            currentY = 50; // Reset Y position to top of new page with margin
            return true;
          }
          return false;
        }
        
        // Helper function to process a node and its children
        function processNode(node, parentFont = "Helvetica", parentSize = 11, indent = 0) {
          if (node.nodeType === 3) { // Text node
            if (node.textContent.trim() !== '') {
              const text = node.textContent.trim();
              
              // Prepare the text with improved word wrapping
              doc.font(parentFont).fontSize(parentSize);
              
              // Calculate text height to prevent overlap
              const textHeight = doc.heightOfString(text, {
                width: maxWidth - indent,
                align: "left"
              });
              
              // Check if we need a page break
              checkPageBreak(textHeight);
              
              // Render the text with proper word wrapping
              doc.text(text, 50 + indent, currentY, {
                width: maxWidth - indent,
                align: "left",
                lineBreak: true,
                lineGap: 2, // Add a small gap between lines for better readability
                wordSpacing: 0.5 // Slightly increase word spacing for better wrapping
              });
              
              currentY += textHeight + 2; // Add a small gap between paragraphs
            }
          } else if (node.nodeType === 1) { // Element node
            let fontSize = parentSize;
            let font = parentFont;
            let additionalIndent = 0;
            
            // Handle different HTML elements
            switch(node.tagName.toLowerCase()) {
              case 'strong':
              case 'b':
                font = "Helvetica-Bold";
                break;
              case 'em':
              case 'i':
                font = "Helvetica-Oblique";
                break;
              case 'h1':
                fontSize = 16;
                font = "Helvetica-Bold";
                // Check if we need a page break for heading + extra space
                checkPageBreak(fontSize + 5);
                currentY += 5; // Add space before heading
                break;
              case 'h2':
                fontSize = 14;
                font = "Helvetica-Bold";
                // Check if we need a page break for heading + extra space
                checkPageBreak(fontSize + 4);
                currentY += 4; // Add space before heading
                break;
              case 'h3':
                fontSize = 12;
                font = "Helvetica-Bold";
                // Check if we need a page break for heading + extra space
                checkPageBreak(fontSize + 3);
                currentY += 3; // Add space before heading
                break;
              case 'p':
                // Check if we need a page break for paragraph + extra space
                checkPageBreak(lineHeight + 2);
                currentY += 2; // Add space between paragraphs
                break;
              case 'ul':
              case 'ol':
                // Check if we need a page break for list + extra space
                checkPageBreak(lineHeight + 5);
                currentY += 5; // Add space before lists
                break;
              case 'li':
                additionalIndent = 15;
                // Check if we need a page break for bullet point
                if (!checkPageBreak(lineHeight)) {
                  // Add bullet point only if we didn't add a page break
                  doc
                    .font(font)
                    .fontSize(fontSize)
                    .text("• ", 50 + indent, currentY);
                }
                break;
              case 'br':
                // Check if we need a page break for line break
                checkPageBreak(lineHeight);
                currentY += lineHeight;
                break;
              case 'table':
                // Simple table handling - just add some space
                // Check if we need a page break for table + extra space
                checkPageBreak(lineHeight + 10);
                currentY += 10;
                break;
              case 'tr':
              case 'td':
                additionalIndent = 5;
                break;
            }
            
            // Process all child nodes with updated font and size
            if (node.hasChildNodes()) {
              // If this is a container with text styling, process all children with this style
              for (let i = 0; i < node.childNodes.length; i++) {
                processNode(node.childNodes[i], font, fontSize, indent + additionalIndent);
              }
            } else if (node.textContent.trim() !== '') {
              // Handle leaf nodes with content
              const text = node.textContent.trim();
              
              // Prepare the text with improved word wrapping
              doc.font(font).fontSize(fontSize);
              
              // Calculate text height to prevent overlap
              const textHeight = doc.heightOfString(text, {
                width: maxWidth - indent - additionalIndent,
                align: "left"
              });
              
              // Check if we need a page break
              checkPageBreak(textHeight);
              
              // Render the text with proper word wrapping
              doc.text(text, 50 + indent + additionalIndent, currentY, {
                width: maxWidth - indent - additionalIndent,
                align: "left",
                lineBreak: true,
                lineGap: 2, // Add a small gap between lines for better readability
                wordSpacing: 0.5 // Slightly increase word spacing for better wrapping
              });
              
              currentY += textHeight + 2;
            }
            
            // Add space after certain elements
            switch(node.tagName.toLowerCase()) {
              case 'h1':
              case 'h2':
              case 'h3':
              case 'p':
              case 'ul':
              case 'ol':
              case 'table':
                // Check if we need a page break for extra space
                if (!checkPageBreak(5)) {
                  currentY += 5;
                }
                break;
            }
          }
        }
        
        // Start processing from the root
        Array.from(tempDiv.childNodes).forEach(node => {
          processNode(node);
        });
        
      } catch (error) {
        console.error("Error rendering formatted text:", error);
        // Fallback to plain text if HTML parsing fails
        // Check if we need a page break
        const plainText = insurance.notes.replace(/<[^>]*>/g, ''); // Strip HTML tags
        const textHeight = doc
          .font("Helvetica")
          .fontSize(11)
          .heightOfString(plainText, { width: 500 });
          
        if (notestart + 30 + textHeight > 800 - 50) {
          doc.addPage();
          doc
            .font("Helvetica")
            .fontSize(11)
            .text(
              plainText,
              50,
              50,
              {
                align: "left",
                width: 500,
                lineBreak: true,
                lineGap: 2, // Add a small gap between lines for better readability
                wordSpacing: 0.5 // Slightly increase word spacing for better wrapping
              }
            );
        } else {
          doc
            .font("Helvetica")
            .fontSize(11)
            .text(
              plainText,
              50,
              notestart + 30,
              {
                align: "left",
                width: 500,
                lineBreak: true,
                lineGap: 2, // Add a small gap between lines for better readability
                wordSpacing: 0.5 // Slightly increase word spacing for better wrapping
              }
            );
        }
      }
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
        <modal v-if="isOpen" :website="userStore.currentWebsite" :body="body" :isOpen="isOpen" :blob="blob" :client="client" :sender="sender" :phone="insurance.customer.phone" :company="company" name="Damage Report" @close-modal="closeModal"></modal>
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
              
              <div @click="sendAttachment()" class="text-white cursor-pointer inline-block bg-green-500 hover:bg-green-600 bg-gradient-to-r focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="svg-inline--fa fa-whatsapp w-6 h-6 inline-block" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="whatsapp" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path class="" fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg> Whatsapp</div>

              <button type="submit" @click="save_type = 'download'" class="text-white cursor-pointer inline-block bg-gray-800 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-gray-300 dark:focus:ring-gray-800 shadow-lg shadow-gray-500/50 dark:shadow-lg dark:shadow-gray-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-5 mr-10"><svg class="w-6 h-6 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download</button>

            </div>
          </div> 

          <div class="pl-5 pr-10 pt-5">
            <!-- Insurance Header -->
            <div class="grid grid-flow-col grid-rows-1 grid-cols-2 gap-8">
              <div class="flex items-center">
                <img id="tux" v-if="profile.estimate_logo" crossOrigin="anonymous" :src="profile.estimate_logo" class="w-24 pr-2" loading="lazy" height="" width="" alt="Invoice Logo">
                <img id="tux" v-else crossOrigin="anonymous" src="@/assets/images/lg.png" class="w-24 pr-2" loading="lazy" height="" width="" alt="Invoice Logo">
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
                <span class="mr-10 w-full"> <!-- Added w-full for better layout -->
                  <TipTapEditor
                    v-model="insurance.notes"
                    placeholder="Enter report details here..."
                    class="bg-slate-100 w-full text-left mb-4 border border-gray-300 rounded"
                  /> <!-- Added basic styling -->
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
  .ql-snow .ql-editor {
    max-height: fit-content !important;
    min-height: 200px;
    overflow: auto;
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

  /* TipTap editor styles are now in TipTapEditor.vue */

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
