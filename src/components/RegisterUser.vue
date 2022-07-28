<script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"  
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

  const loading = ref(false)
  const status = ref(null)
  const userStore = useUserStore()
  const router = useRouter()
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
  ]
  const employeesCampaign = ["1 - 20 employees", "21 - 200 employees", "201 - 10,000 employees", "10,001+ employees"]

  async function register (credentials) {
    loading.value = true
    userStore.register({      
      ...credentials
    })
    .then(() => { loading.value = false; router.push({ name: 'dashboard' }) })
    .catch(err => { loading.value = false; status.value = err.response.status })
  }
</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <div>
    <FormKit
      type="form"
      id="registration"
      :form-class="submitted ? 'hide' : 'show'"
      submit-label="Register"
      @submit="register"
      :actions="false"
      #default="{ value }"
    >
      <h2 class="text-3xl tracking-tight sm:text-3xl md:text-3xl">Start your free trial. No credit card required.</h2>
      <hr />

      <div class="double">
        <FormKit
          type="text"
          name="firstName"
          label="First Name"
          placeholder="Jane"
          outer-class="text-left"
          validation="required"
        />
        <FormKit
          type="text"
          name="lastName"
          label="Last Name"
          placeholder="Doe"
          outer-class="text-left"
          validation="required"
        />
      </div>

      <div class="double">
        <FormKit
          type="text"
          name="email"
          label="Email"
          placeholder="jane@company.com"
          outer-class="text-left"
          validation="required|email"
        />
        <FormKit
          type="select"
          name="country"
          label="Country"
          placeholder="Select Country"
          label-class="text-left"
          :options=countryCampaign
          validation="required"
        />
      </div>

      <div class="double">
        <FormKit
          type="text"
          name="company"
          label="Company"
          placeholder="Company Name"
          outer-class="text-left"
          validation="required"
        />
        <FormKit
          type="select"
          name="employees"
          label="Employees"
          placeholder="21 - 200 employees"
          :options=employeesCampaign
          outer-class="text-left"
          validation="required"
        />
      </div>
      <div class="double">
        <FormKit
          type="password"
          name="password"
          label="Password"
          placeholder="********"
          outer-class="text-left"
          validation="required|length:6|matches:/[^a-zA-Z]/"
          :validation-messages="{
            matches: 'Please include at least one symbol',
          }"
        />
        <FormKit
          type="password"
          name="password_confirm"
          label="Confirm password"
          placeholder="********"
          outer-class="text-left"
          validation="required|confirm"
        />
      </div>

      <FormKit
        type="checkbox"
        label="Marketing Emails"
        name="marketing"
        outer-class="text-left"
      />

      <FormKit
          type="checkbox"
          name="policy"
          label="I agree to the Terms of Service and Privacy Policy."
          outer-class="text-left"
          validation="accepted"
          validation-visibility="dirty"
        />

      <FormKit
        type="submit"
        label="Register"
      />

    </FormKit>
      
  </div>
</template>


