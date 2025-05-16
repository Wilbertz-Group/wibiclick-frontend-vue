// wibiclick-frontend-vue/src/views/Profile.vue
<script setup>
  import axios from "axios";
  import { onMounted, ref } from "vue";
  import { useUserStore } from "@/stores/UserStore"
  import Header from "@/components/Header.vue";
  import Alert from "@/components/Alert.vue";
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import { useToast } from 'vue-toast-notification';

  const toast = useToast();
  const profile = ref({ 
    email: '', 
    firstName: '',
    lastName: '', 
    companyEmail: '', 
    country: '',
    address: '', 
    city: '', 
    state: '', 
    zip: '', 
    marketing: false, 
    updates: false,
    banking: {
      account_name: '',
      bank: '',
      account_number: '',
      account_type: '',
      branch_code: '',
    },
    company: {
      company_name: '',
      email: '',
      slogan: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      currency_symbol: ''
    },
    setting: ''
  })
  const notificationMessage = ref('')
  const countryCampaign = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "American Samoa",
    "Andorra",
    "Angola",
    "Anguilla",
    "Antarctica",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Aruba",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bermuda",
    "Bhutan",
    "Bolivia (Plurinational State of)",
    "Bonaire, Sint Eustatius and Saba",
    "Bosnia and Herzegovina",
    "Botswana",
    "Bouvet Island",
    "Brazil",
    "British Indian Ocean Territory",
    "Brunei Darussalam",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cayman Islands",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Christmas Island",
    "Cocos (Keeling) Islands",
    "Colombia",
    "Comoros",
    "Congo (the Democratic Republic of the)",
    "Congo",
    "Cook Islands",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Curaçao",
    "Cyprus",
    "Czechia",
    "Côte d'Ivoire",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Falkland Islands [Malvinas]",
    "Faroe Islands",
    "Fiji",
    "Finland",
    "France",
    "French Guiana",
    "French Polynesia",
    "French Southern Territories",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Gibraltar",
    "Greece",
    "Greenland",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guernsey",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Heard Island and McDonald Islands",
    "Holy See",
    "Honduras",
    "Hong Kong",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran (Islamic Republic of)",
    "Iraq",
    "Ireland",
    "Isle of Man",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jersey",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Korea (the Democratic People's Republic of)",
    "Korea (the Republic of)",
    "Kuwait",
    "Kyrgyzstan",
    "Lao People's Democratic Republic",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Macao",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Martinique",
    "Mauritania",
    "Mauritius",
    "Mayotte",
    "Mexico",
    "Micronesia (Federated States of)",
    "Moldova (the Republic of)",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Montserrat",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Caledonia",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Niue",
    "Norfolk Island",
    "Northern Mariana Islands",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine, State of",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Pitcairn",
    "Poland",
    "Portugal",
    "Puerto Rico",
    "Qatar",
    "Republic of North Macedonia",
    "Romania",
    "Russian Federation",
    "Rwanda",
    "Réunion",
    "Saint Barthélemy",
    "Saint Helena, Ascension and Tristan da Cunha",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Martin (French part)",
    "Saint Pierre and Miquelon",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Sint Maarten (Dutch part)",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Georgia and the South Sandwich Islands",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Svalbard and Jan Mayen",
    "Sweden",
    "Switzerland",
    "Syrian Arab Republic",
    "Taiwan",
    "Tajikistan",
    "Tanzania, United Republic of",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tokelau",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Turks and Caicos Islands",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom of Great Britain and Northern Ireland",
    "United States Minor Outlying Islands",
    "United States of America",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Venezuela (Bolivarian Republic of)",
    "Viet Nam",
    "Virgin Islands (British)",
    "Virgin Islands (U.S.)",
    "Wallis and Futuna",
    "Western Sahara",
    "Yemen",
    "Zambia",
    "Zimbabwe",
    "Åland Islands"
  ];
  const userStore = useUserStore()
  const loading = ref(false)
  const logo = ref()

  async function fetchProfileInfo() {
			try {
        loading.value = true
				const response = await axios.get('profile?id='+ userStore.currentWebsite);
        profile.value = response.data
        logo.value = response.data.invoice_logo
        loading.value = false
			} catch (error) {
				console.log(error)
			}
  }

  async function profileUpdate(credentials) {
    loading.value = true
    userStore.updateProfile({
      ...credentials
    })
    .then(() => { 
      loading.value = false
      toast.success("Profile updated successfully")
    })
    .catch(err => { loading.value = false; status.value = err.response.status })
  }

  async function companyUpdate(credentials) {
    try {
      loading.value = true
      const response = await axios.post('company-information', credentials);
      loading.value = false
      toast.success(response.data.message)
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  async function updateLogin(credentials) {
    loading.value = true
    userStore.updateLogin({
      ...credentials
    })
    .then(() => { 
      loading.value = false
      toast.success("Profile updated successfully")
    })
    .catch(err => { loading.value = false; status.value = err.response.status })
  }

  async function uploadImage(data) {

    // Robust validation
    if (
      !data.logo ||
      !Array.isArray(data.logo) ||
      !data.logo[0] ||
      !data.logo[0].file ||
      !(data.logo[0].file instanceof File)
    ) {
      toast.error("No valid logo file selected. Please choose a file before uploading.");
      return;
    }

    const body = new FormData();
    body.append('name', data.logo[0].name);
    body.append('logo', data.logo[0].file);

    try {
      loading.value = true;

      const res = await axios.post(`upload-logo?id=${userStore.currentWebsite}`, body, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.status == 200) {
        logo.value = res.data.downloadUrl;
      }

      loading.value = false;
    } catch (error) {
      console.log(error);
      toast.error("Failed to upload logo. Please try again.");
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchProfileInfo();
  })
</script>

<template>
  <!-- Main container -->
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <Alert v-if="notificationMessage" :notification-message="notificationMessage" />
    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <ScaleLoader color="#4f46e5" /> <!-- Use consistent loader -->
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <!-- Add buttons or other header elements if needed -->
      </header>

      <!-- Profile Login Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Login Information</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your email and password used to access the dashboard.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
            <FormKit
              type="form"
              id="loginForm"
              :form-class="submitted ? 'hide' : 'show'"
              submit-label="Update Login"
              @submit="updateLogin"
              :actions="false"
              #default="{ state: { dirty } }"
            >
              <div class="p-5 sm:p-6 space-y-4">
                <FormKit
                  type="text"
                  name="email"
                  label="Email Address"
                  placeholder="jane@example.com"
                  validation="required|email"
                  v-model="profile.email"
                  :classes="{
                    outer: 'mb-4',
                    label: 'label-modern',
                    inner: '',
                    input: 'input-modern',
                    help: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
                    message: 'text-red-500 text-xs mt-1'
                  }"
                />
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="password"
                    name="password"
                    label="New Password"
                    validation="length:6|matches:/[^a-zA-Z]/"
                    :validation-messages="{ matches: 'Please include at least one symbol' }"
                    placeholder="Enter new password (optional)"
                    :classes="{
                      outer: 'mb-0',
                      label: 'label-modern',
                      inner: '',
                      input: 'input-modern',
                      help: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
                      message: 'text-red-500 text-xs mt-1'
                    }"
                  />
                  <FormKit
                    type="password"
                    name="password_confirm"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    validation="confirm"
                    validation-label="Password confirmation"
                    :classes="{
                      outer: 'mb-0',
                      label: 'label-modern',
                      inner: '',
                      input: 'input-modern',
                      help: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
                      message: 'text-red-500 text-xs mt-1'
                    }"
                  />
                </div>
                 <p class="text-xs text-gray-500 dark:text-gray-400">Leave password fields blank if you do not wish to change your password.</p>
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Update Login"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-10 md:my-14 border-gray-200 dark:border-gray-700/50">

      <!-- Personal Information Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Personal Information</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Basic contact information.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
            <FormKit
              type="form"
              id="personalInfoForm"
              :form-class="submitted ? 'hide' : 'show'"
              submit-label="Update Information"
              @submit="profileUpdate"
              :actions="false"
              #default="{ state: { dirty } }"
            >
              <div class="p-5 sm:p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="firstName"
                    label="First Name"
                    validation="required"
                    v-model="profile.firstName"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="lastName"
                    label="Last Name"
                    validation="required"
                    v-model="profile.lastName"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="companyEmail"
                    label="Contact Email"
                    validation="required|email"
                    v-model="profile.companyEmail"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="select"
                    name="country"
                    label="Country"
                    :options="countryCampaign"
                    validation="required"
                    v-model="profile.country"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern input-modern--select', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <FormKit
                  type="text"
                  name="address"
                  label="Street Address"
                  validation="required"
                  v-model="profile.address"
                  :classes="{ outer: 'mb-4', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                />
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormKit
                    type="text"
                    name="city"
                    label="City"
                    validation="required"
                    v-model="profile.city"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="state"
                    label="State / Province"
                    validation="required"
                    v-model="profile.state"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="zip"
                    label="Zip / Postal Code"
                    validation="required"
                    v-model="profile.zip"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Update Information"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-10 md:my-14 border-gray-200 dark:border-gray-700/50" v-if="userStore.user.permission == 'owner'">

      <!-- Company Information Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14" v-if="userStore.user.permission == 'owner'">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Company Information</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Details about your company for branding and invoices.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
            <FormKit
              type="form"
              id="companyInfoForm"
              :form-class="submitted ? 'hide' : 'show'"
              submit-label="Update Company"
              @submit="companyUpdate"
              :actions="false"
              #default="{ state: { dirty } }"
            >
              <div class="p-5 sm:p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="company_name"
                    label="Company Name"
                    validation="required"
                    v-model="profile.company.company_name"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="slogan"
                    label="Slogan"
                    v-model="profile.company.slogan"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="email"
                    label="Company Email"
                    validation="required|email"
                    v-model="profile.company.email"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="currency_symbol"
                    label="Currency Symbol"
                    placeholder="$ or R"
                    validation="required"
                    v-model="profile.company.currency_symbol"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <FormKit
                  type="text"
                  name="address1"
                  label="Street Address 1"
                  validation="required"
                  v-model="profile.company.address1"
                  :classes="{ outer: 'mb-4', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                />
                <FormKit
                  type="text"
                  name="address2"
                  label="Street Address 2"
                  v-model="profile.company.address2"
                  :classes="{ outer: 'mb-4', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                />
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormKit
                    type="text"
                    name="city"
                    label="City"
                    validation="required"
                    v-model="profile.company.city"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="state"
                    label="State / Province"
                    validation="required"
                    v-model="profile.company.state"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="postal_code"
                    label="Zip / Postal Code"
                    validation="required"
                    v-model="profile.company.postal_code"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <FormKit
                  type="select"
                  name="country"
                  label="Country"
                  :options="countryCampaign"
                  validation="required"
                  v-model="profile.company.country"
                  :classes="{ outer: 'mb-4', label: 'label-modern', input: 'input-modern input-modern--select', message: 'text-red-500 text-xs mt-1' }"
                />
                <FormKit type="hidden" v-model="profile.setting" name="setting" />
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Update Company"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-10 md:my-14 border-gray-200 dark:border-gray-700/50" v-if="userStore.user.permission == 'owner'">

      <!-- Banking Details Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14" v-if="userStore.user.permission == 'owner'">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Banking Details</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Company banking information for invoices.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
            <FormKit
              type="form"
              id="bankingForm"
              :form-class="submitted ? 'hide' : 'show'"
              submit-label="Update Banking"
              @submit="companyUpdate" 
              :actions="false"
              #default="{ state: { dirty } }"
            >
              <div class="p-5 sm:p-6 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="account_name"
                    label="Account Name"
                    validation="required"
                    v-model="profile.banking.account_name"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="bank"
                    label="Bank Name"
                    validation="required"
                    v-model="profile.banking.bank"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormKit
                    type="text"
                    name="account_number"
                    label="Account Number"
                    validation="required"
                    v-model="profile.banking.account_number"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                  <FormKit
                    type="text"
                    name="account_type"
                    label="Account Type"
                    placeholder="Cheque or Current"
                    validation="required"
                    v-model="profile.banking.account_type"
                    :classes="{ outer: 'mb-0', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                  />
                </div>
                <FormKit
                  type="text"
                  name="branch_code"
                  label="Branch Code"
                  validation="required"
                  v-model="profile.banking.branch_code"
                  :classes="{ outer: 'mb-4', label: 'label-modern', input: 'input-modern', message: 'text-red-500 text-xs mt-1' }"
                />
                <FormKit type="hidden" v-model="profile.setting" name="setting" />
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Update Banking"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-10 md:my-14 border-gray-200 dark:border-gray-700/50">

      <!-- Notifications Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Notifications</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose which communications you'd like to receive.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
            <FormKit
              type="form"
              id="notificationsForm"
              :form-class="submitted ? 'hide' : 'show'"
              submit-label="Update Preferences"
              @submit="profileUpdate" 
              :actions="false"
              #default="{ state: { dirty } }"
            >
              <div class="p-5 sm:p-6 space-y-4">
                 <FormKit
                    type="checkbox"
                    label="Marketing Emails"
                    name="marketing"
                    v-model="profile.marketing"
                    :classes="{
                      outer: 'mb-4',
                      label: '$reset block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0 ml-2',
                      wrapper: 'flex items-center',
                      input: 'h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600'
                    }"
                  />
                 <FormKit
                    type="checkbox"
                    label="Product Updates and Offers"
                    name="updates"
                    v-model="profile.updates"
                     :classes="{
                      outer: 'mb-4',
                      label: '$reset block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0 ml-2',
                      wrapper: 'flex items-center',
                      input: 'h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600'
                    }"
                  />
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Update Preferences"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <hr class="my-10 md:my-14 border-gray-200 dark:border-gray-700/50" v-if="userStore.user.permission == 'owner'">

      <!-- Invoice Logo Section -->
      <div class="md:grid md:grid-cols-3 md:gap-6 mb-10 md:mb-14" v-if="userStore.user.permission == 'owner'">
        <div class="md:col-span-1 px-4 sm:px-0">
          <h3 class="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Invoice Logo</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload a logo to appear on your invoices.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="card-modern">
             <FormKit
                id="logoForm"
                type="form"
                @submit="uploadImage"
                :actions="false"
                #default="{ state: { dirty } }"
              >
              <div class="p-5 sm:p-6 space-y-4">
                <div class="text-center mb-4" v-if="logo">
                  <p class="label-modern mb-2">Current Logo:</p>
                  <img :src="logo" class="m-auto max-h-24 w-auto border border-gray-200 dark:border-gray-700 rounded" loading="lazy" alt="Invoice Logo">
                </div>
                <FormKit
                  type="file"
                  label="Upload New Logo"
                  name="logo"
                  help="Accepts .jpg, .png, .jpeg, .svg"
                  accept=".jpg,.png,.jpeg,.svg"
                  validation="required"
                  :classes="{
                    outer: 'mb-4',
                    label: 'label-modern',
                    inner: 'max-w-md', /* Constrain width */
                    input: 'block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900',
                    help: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
                    message: 'text-red-500 text-xs mt-1'
                  }"
                />
              </div>
              <div class="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 text-right rounded-b-lg">
                <FormKit
                  type="submit"
                  label="Upload Logo"
                  :disabled="!dirty"
                  :classes="{
                    input: dirty ? 'btn-primary-modern' : 'btn-disabled-modern'
                  }"
                />
              </div>
            </FormKit>
          </div>
        </div>
      </div>

    </div> <!-- End container -->
  </div> <!-- End main div -->
</template>

<style scoped>
/* Modern Input Styles */
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.input-modern--select {
  @apply pr-8 appearance-none bg-no-repeat;
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

/* Modern Button Styles */
.btn-primary-modern {
    @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm;
    @apply hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800;
    @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-secondary-modern {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-disabled-modern {
    @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 border border-transparent rounded-md shadow-sm cursor-not-allowed;
}


/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden; /* Added overflow-hidden */
}

/* FormKit overrides - adjust selectors as needed based on FormKit's generated HTML */
:deep(.formkit-outer) {
  @apply mb-4; /* Default spacing */
}
:deep(.formkit-label) {
  @apply label-modern; /* Apply label style */
}
:deep(.formkit-input[type="text"]),
:deep(.formkit-input[type="email"]),
:deep(.formkit-input[type="password"]),
:deep(.formkit-input[type="tel"]),
:deep(.formkit-input[type="select"]),
:deep(.formkit-textarea) {
  @apply input-modern; /* Apply input style */
}
:deep(.formkit-input[type="select"]) {
  @apply input-modern--select; /* Apply select arrow */
}
:deep(.formkit-input[type="checkbox"]) {
   /* Style checkbox using FormKit classes prop instead */
   @apply hidden; /* Hide default checkbox if using custom styling via label */
}
:deep(.formkit-input[type="file"]::file-selector-button) {
  /* Style file input button if needed, or use classes prop */
   @apply mr-4 py-2 px-4 rounded-md border-0 text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900;
}
:deep(.formkit-input[type="submit"]) {
  /* Style submit button using classes prop */
  @apply btn-primary-modern;
}
:deep(.formkit-message) {
  @apply text-red-500 dark:text-red-400 text-xs mt-1; /* Style validation messages */
}
:deep(.formkit-help) {
  @apply text-xs text-gray-500 dark:text-gray-400 mt-1; /* Style help text */
}

/* Ensure transitions apply broadly */
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>