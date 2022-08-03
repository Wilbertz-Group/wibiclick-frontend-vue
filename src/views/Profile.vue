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
    updates: false
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
  const employeesCampaign = ["1 - 20 employees", "21 - 200 employees", "201 - 10,000 employees", "10,001+ employees"]
  const userStore = useUserStore()
  const loading = ref(false)

  async function fetchProfileInfo() {
			try {
        loading.value = true
				const response = await axios.get('profile');
        profile.value = response.data
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
      const response = await axios.post('organisation', credentials);
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

  onMounted(() => {
    fetchProfileInfo();
  })
</script>

<template>
  <Alert v-if="notificationMessage" :notification-message="notificationMessage" />
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <Header title="Your Profile" />  
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Profile</h3>
              <p class="mt-1 text-sm text-gray-600">This information will be used to login to this dashboard.</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                <FormKit
                    type="form"
                    id="profile"
                    :form-class="submitted ? 'hide' : 'show'"
                    submit-label="Update"
                    @submit="updateLogin"
                    :actions="false"
                    #default="{ value }"
                  >
                  <div class="px-4 py-5 bg-white space-y-6 sm:p-6">                  
                    <div class="w-full">
                      <div class="">
                        <FormKit
                          type="text"
                          name="email"
                          label="Your Email"
                          label-class="text-left"
                          placeholder="jane@example.com"
                          validation="required|email"
                          v-model="profile.email"
                        />
                      </div>
                    </div>

                    <div>
                      <div class="double">
                        <FormKit
                          type="password"
                          name="password"
                          label="New Password"
                          label-class="text-left"
                          validation="required|length:6|matches:/[^a-zA-Z]/"
                          :validation-messages="{
                            matches: 'Please include at least one symbol',
                          }"
                          placeholder="Your password"
                        />
                        <FormKit
                          type="password"
                          name="password_confirm"
                          label="Confirm password"
                          label-class="text-left"
                          placeholder="Confirm password"
                          validation="required|confirm"
                        />
                      </div>
                    </div>

                  </div>
                  <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <FormKit
                      type="submit"
                      label="Update"
                    />
                  </div>
                </FormKit>
              </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block" aria-hidden="true">
        <div class="py-5">
          <div class="border-t border-gray-200" />
        </div>
      </div>

      <div class="mt-10 sm:mt-0">
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
              <p class="mt-1 text-sm text-gray-600">Use a permanent address where you can receive mail.</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                <FormKit
                    type="form"
                    id="profile"
                    :form-class="submitted ? 'hide' : 'show'"
                    submit-label="Update"
                    @submit="profileUpdate"
                    :actions="false"
                    #default="{ value }"
                  >
                  <div class="px-4 py-5 bg-white space-y-6 sm:p-6">                  
                    <div class="w-full">
                      <div class="grid grid-cols-2 gap-3">
                        <FormKit
                          type="text"
                          name="firstName"
                          label="First Name"
                          label-class="text-left"
                          validation="required"
                          v-model="profile.firstName"
                        />

                        <FormKit
                          type="text"
                          name="lastName"
                          label="Last Name"
                          label-class="text-left"
                          validation="required"
                          v-model="profile.lastName"
                        />
                      </div>
                    </div>

                    <div class="w-full">
                      <div class="grid grid-cols-2 gap-3">
                        <FormKit
                          type="text"
                          name="companyEmail"
                          label="Company Email"
                          label-class="text-left"
                          validation="required|email"
                          v-model="profile.companyEmail"
                        />
  
                        <FormKit
                          type="select"
                          name="country"
                          label="Country"
                          label-class="text-left"
                          :options=countryCampaign
                          validation="required"
                          v-model="profile.country"
                        />
                      </div>
                    </div>

                    <div class="w-full">
                      <div class="">
                        <FormKit
                          type="text"
                          name="address"
                          label="Street address"
                          label-class="text-left"
                          validation="required"
                          v-model="profile.address"
                        />
                      </div>
                    </div>

                    <div class="w-full">
                      <div class="grid grid-cols-3 gap-3">
                        <FormKit
                          type="text"
                          name="city"
                          label="City"
                          label-class="text-left"
                          validation="required"
                          v-model="profile.city"
                        />
                        <FormKit
                          type="text"
                          name="state"
                          label="State / Province"
                          label-class="text-left"
                          validation="required"
                          v-model="profile.state"
                        />
                        <FormKit
                          type="text"
                          name="zip"
                          label="Zip / Postal code"
                          label-class="text-left"
                          validation="required"  
                          v-model="profile.zip"                        
                        />
                      </div>
                    </div>

                  </div>
                  <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <FormKit
                      type="submit"
                      label="Update"
                    />
                  </div>
                </FormKit>
              </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block" aria-hidden="true">
        <div class="py-5">
          <div class="border-t border-gray-200" />
        </div>
      </div>

      <div class="mt-10 sm:mt-0">
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Company Information</h3>
              <p class="mt-1 text-sm text-gray-600">Update your company/organisation information</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                <FormKit
                    type="form"
                    id="profile"
                    :form-class="submitted ? 'hide' : 'show'"
                    submit-label="Update"
                    @submit="companyUpdate"
                    :actions="false"
                    #default="{ value }"
                  >
                  <div class="px-4 py-5 bg-white space-y-6 sm:p-6">                  
                    
                    <div class="w-full">
                      <div class="">
                        <FormKit
                          type="text"
                          name="company"
                          label="Company"
                          :placeholder="profile.company"
                          outer-class="text-left"
                          validation="required"
                          :value="profile.company"
                          v-model="profile.company"
                        />
                      </div>
                    </div>

                    <div class="w-full">
                      <div class="">
                        <FormKit
                          type="select"
                          name="employees"
                          label="Employees"
                          :placeholder="profile.employees"
                          :options=employeesCampaign
                          outer-class="text-left"
                          validation="required"
                          v-model="profile.employees"
                        />
                      </div>
                    </div>

                  </div>
                  <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <FormKit
                      type="submit"
                      label="Update"
                    />
                  </div>
                </FormKit>
              </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block" aria-hidden="true">
        <div class="py-5">
          <div class="border-t border-gray-200" />
        </div>
      </div>

      <div class="mt-10 sm:mt-0">
        <div class="md:grid md:grid-cols-3 md:gap-6">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
              <p class="mt-1 text-sm text-gray-600">Decide which communications you'd like to receive and how.</p>
            </div>
          </div>
          <div class="mt-5 md:mt-0 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                <FormKit
                    type="form"
                    id="profile"
                    :form-class="submitted ? 'hide' : 'show'"
                    submit-label="Update"
                    @submit="profileUpdate"
                    :actions="false"
                    #default="{ value }"
                  >
                  <div class="px-4 py-5 bg-white space-y-6 sm:p-6">                  
                    <div class="w-full">
                      <div class="">
                        <FormKit
                          type="checkbox"
                          label="Marketing Emails"
                          name="marketing"
                          v-model="profile.marketing"
                        />
                      </div>
                    </div>

                    <div>
                      <div class="">
                        <FormKit
                          type="checkbox"
                          label="Product Updates and Offers"
                          name="updates"
                          v-model="profile.updates"
                        />
                      </div>
                    </div>

                  </div>
                  <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                    <FormKit
                      type="submit"
                      label="Update"
                    />
                  </div>
                </FormKit>
              </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
  </div>
  <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>
