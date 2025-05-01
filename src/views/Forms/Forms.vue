// wibiclick-frontend-vue/src/views/Forms/Forms.vue
<script setup>
import axios from "axios";
// import Header from "@/components/Header.vue"; // Removed old header
import  useUserStore  from "@/stores/UserStore"
import { onMounted, ref, computed, watch, reactive, watchEffect } from "vue"; // Added reactive, watchEffect
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue' // Added loader
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
import {
  faSun, faMoon, faSync, faArrowLeft, faArrowRight, faCheck // Added icons
} from '@fortawesome/free-solid-svg-icons'

import stoveImage from '@/assets/images/forms/stove.png';
import fridgeImage from '@/assets/images/forms/fridge.png';
import laundryImage from '@/assets/images/forms/laundry.png';
import dishwasherImage from '@/assets/images/forms/dishwasher.png';

import ovenImage from '@/assets/images/forms/oven.png';
import cookerImage from '@/assets/images/forms/cooker.png';
import hobImage from '@/assets/images/forms/hob.png';
import cookerhoodImage from '@/assets/images/forms/extractor.png';
import microwaveImage from '@/assets/images/forms/microwave.png';

import fridgeeImage from '@/assets/images/forms/fridgeeee.png';
import americanImage from '@/assets/images/forms/american.png';
import wineImage from '@/assets/images/forms/wine.png';

import washingMachineImage from '@/assets/images/forms/washing-machine.png';
import tumbleDryerImage from '@/assets/images/forms/tumble-dry.png';

import fullSizeImage from '@/assets/images/forms/full-size.png';
import slimLineImage from '@/assets/images/forms/slim-line.png';
import tabletopImage from '@/assets/images/forms/tabletop.png';

import electricImage from '@/assets/images/forms/electric.png';
import gasImage from '@/assets/images/forms/gas.png';
import dualImage from '@/assets/images/forms/dual.png';

import freestandingImage from '@/assets/images/forms/freestanding.png';
import integratedImage from '@/assets/images/forms/integrated.png';

library.add(
  faSun, faMoon, faSync, faArrowLeft, faArrowRight, faCheck
)

const step = ref(1);
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Added dark mode state
const loading = ref(false); // Added loading state
const applianceCategory = ref('');
const applianceType = ref('');
const fuelType = ref('');
const fittingType = ref('');
const brand = ref({ make: '', model: '' });
const faultInfo = ref('');
const userDetails = ref({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  replyMethod: ''
});
const preferredDateTime = ref('');
const errors = ref({});

const fuelOptions = [
  { label: 'Electric', value: 'Electric', image: electricImage },
  { label: 'Gas', value: 'Gas', image: gasImage },
  { label: 'Dual Fuel', value: 'Dual Fuel', image: dualImage }
];
const fittingOptions = [
  { label: 'Freestanding', value: 'Freestanding', image: freestandingImage },
  { label: 'Integrated', value: 'Integrated', image: integratedImage }
];
const formData = ref({});
const direction = ref('forward');

const applianceCategoryOptions = [
  { label: 'Cooking', value: 'Cooking', image: stoveImage },
  { label: 'Fridges', value: 'Fridges', image: fridgeImage },
  { label: 'Laundry', value: 'Laundry', image: laundryImage },
  { label: 'Dishwasher', value: 'Dishwasher', image: dishwasherImage }
];

const applianceOptions = computed(() => {
  if (applianceCategory.value === 'Cooking') {
    return [
      { label: 'Oven', value: 'Oven', image: ovenImage },
      { label: 'Cooker', value: 'Cooker', image: cookerImage },
      { label: 'Hob', value: 'Hob', image: hobImage },
      { label: 'CookerHood', value: 'CookerHood', image: cookerhoodImage },
      { label: 'Microwave', value: 'Microwave', image: microwaveImage }
    ];
  } else if (applianceCategory.value === 'Fridges') {
    return [
      { label: 'Fridge/Freezer', value: 'Fridge/Freezer', image: fridgeeImage },
      { label: 'American Style', value: 'American Style', image: americanImage },
      { label: 'Wine Cooler', value: 'Wine Cooler', image: wineImage }
    ];
  } else if (applianceCategory.value === 'Laundry') {
    return [
      { label: 'Washing Machine', value: 'Washing Machine', image: washingMachineImage },
      { label: 'Tumble Dryer', value: 'Tumble Dryer', image: tumbleDryerImage }
    ];
  } else if (applianceCategory.value === 'Dishwasher') {
    return [
      { label: 'Full-Size', value: 'Full-Size', image: fullSizeImage },
      { label: 'Slim-Line', value: 'Slim-Line', image: slimLineImage },
      { label: 'Tabletop', value: 'Tabletop', image: tabletopImage }
    ];
  }
  return [];
});

// Function to save data for the current step
const saveCurrentStepData = () => {
  const currentStep = step.value; // Capture step before potential async changes
  if (currentStep === 1) {
    formData.value.applianceCategory = applianceCategory.value;
  } else if (currentStep === 2) {
    formData.value.applianceType = applianceType.value;
  } else if (currentStep === 3) {
    // Save fuelType only if relevant, fittingType if microwave
    if (['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType.value)) {
       formData.value.fuelType = fuelType.value;
    }
    if (applianceType.value === 'Microwave') {
       formData.value.fittingType = fittingType.value;
    }
  } else if (currentStep === 4) {
    // Save fittingType if not microwave (already saved in step 3 if microwave)
    if (applianceType.value !== 'Microwave') {
       formData.value.fittingType = fittingType.value;
    }
  } else if (currentStep === 5) {
    formData.value.brand = { ...brand.value }; // Clone object
  } else if (currentStep === 6) {
    formData.value.faultInfo = faultInfo.value;
  } else if (currentStep === 7) {
    formData.value.userDetails = { ...userDetails.value }; // Clone object
  } else if (currentStep === 8) {
    formData.value.preferredDateTime = preferredDateTime.value;
  }
};

// Function to handle advancing to the next step, including skip logic
const goToNextStep = () => {
  direction.value = 'forward';
  const currentStep = step.value;
  let nextStep = currentStep + 1;

  // Skip Fuel Type step if not applicable
  if (currentStep === 2 && applianceCategory.value !== 'Cooking') {
    formData.value.fuelType = null; // Ensure fuelType is null if skipped
    nextStep = 4; // Skip to Fitting Type
  }
  // Skip Fuel Type step if Microwave is selected in step 2
  else if (currentStep === 2 && applianceType.value === 'Microwave') {
    formData.value.fuelType = null; // Ensure fuelType is null
    // Don't skip here, Microwave fitting is handled in step 3's section
    // nextStep remains 3
  }
  // Skip Fitting Type step if Microwave was selected (fitting handled in step 3)
  else if (currentStep === 3 && applianceType.value === 'Microwave') {
     nextStep = 5; // Skip to Brand
  }


  if (nextStep <= 8) { // Ensure we don't go beyond the last step
    step.value = nextStep;
  }
};

// Combined function for manual "Next" button clicks
const handleManualNext = () => {
   saveCurrentStepData(); // Save data for the current step first
   goToNextStep();      // Then advance
};

const goBack = () => {
  direction.value = 'backward';
  if (step.value === 4 && (applianceCategory.value !== 'Cooking' || applianceType.value === 'Microwave')) {
    step.value = 2;
  } else {
    step.value--;
  }
};

const brands = ['Smeg', 'Bosch', 'Samsung', 'Whirpool', 'Defy', 'Indesit', 'AEG', 'Beko', 'Hisense', 'Grandig', 'LG', 'Miele', 'Neff', 'Siemens', 'Zanussi', 'Russell Hobbs', 'Hotpoint', 'Hoover', 'Candy', 'Electrolux', 'Gorenje', 'Panasonic', 'Sharp', 'Daewoo', 'Kenwood', 'Breville', 'Morphy Richards', 'DeLonghi', 'Tefal', 'Philips', 'Dyson', 'Vax', 'Di', 'Other'];

const submitForm = async () => {
  const formData = {
    applianceCategory: applianceCategory.value,
    applianceType: applianceType.value,
    fuelType: fuelType.value,
    fittingType: fittingType.value,
    brand: brand.value,
    faultInfo: faultInfo.value,
    userDetails: userDetails.value,
    preferredDateTime: preferredDateTime.value
  };

  try {
    const response = await fetch('/api/submitForm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      // Navigate to success page
    } else {
      const data = await response.json();
      errors.value = data.errors;
    }
  } catch (error) {
    console.error("Error submitting form:", error);
  }
};

// Watchers for auto-advancing steps 1-4
watch(applianceCategory, (newValue) => {
  // Only auto-advance if a valid option is chosen in step 1
  if (newValue && step.value === 1) {
    // Use nextTick to ensure DOM updates before potentially saving/advancing
    // Although saving happens based on step.value before incrementing, it's safer
    // await nextTick(); // Might not be strictly necessary here
    saveCurrentStepData();
    goToNextStep();
  }
});

watch(applianceType, (newValue) => {
  if (newValue && step.value === 2) {
    saveCurrentStepData();
    goToNextStep();
  }
});

watch(fuelType, (newValue) => {
  // Only advance from step 3 if fuelType is selected (and relevant)
  if (newValue && step.value === 3 && ['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType.value)) {
    saveCurrentStepData();
    goToNextStep();
  }
});

watch(fittingType, (newValue) => {
   // Advance if fittingType is selected in step 3 (Microwave) or step 4 (Others)
  if (newValue && step.value === 3 && applianceType.value === 'Microwave') {
    saveCurrentStepData(); // Saves fittingType for Microwave
    goToNextStep(); // Skips step 4
  } else if (newValue && step.value === 4 && applianceType.value !== 'Microwave') {
    saveCurrentStepData(); // Saves fittingType for others
    goToNextStep();
  }
});

// Removed old watch([step, applianceCategory]...)

// Add dark mode toggle function
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
  document.documentElement.classList.toggle('dark', isDarkMode.value);
};

onMounted(() => {
  document.documentElement.classList.toggle('dark', isDarkMode.value); // Apply on initial load
});

</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          Book a Repair
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Add Website Selector if needed -->
          <button @click="toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
             <font-awesome-icon :icon="isDarkMode ? 'sun' : 'moon'" />
          </button>
          <!-- Add other buttons if needed -->
        </div>
      </header>

      <!-- Form Container -->
      <div class="card-modern p-6 sm:p-8 max-w-3xl mx-auto">
        <!-- Form Steps will go here, replacing FormKit -->
        <form @submit.prevent="submitForm">
          <!-- Step 1: Appliance Category -->
          <section v-if="step === 1" class="mb-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">What type of appliance needs repairing?</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label v-for="option in applianceCategoryOptions" :key="option.value"
                     :class="[
                       'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out',
                       applianceCategory === option.value
                         ? 'border-indigo-500 ring-2 ring-indigo-300 dark:border-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                         : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                     ]">
                <input type="radio" :id="'cat-' + option.value" :value="option.value" v-model="applianceCategory" class="sr-only" />
                <img :src="option.image" :alt="option.label" class="w-16 h-16 mb-2 object-contain">
                <span class="text-sm font-medium text-center text-gray-700 dark:text-gray-300">{{ option.label }}</span>
              </label>
            </div>
          </section>

          <!-- Step 2: Appliance Type -->
          <section v-if="step === 2" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Select Appliance Type</h2>
             <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <label v-for="option in applianceOptions" :key="option.value"
                      :class="[
                        'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out',
                        applianceType === option.value
                          ? 'border-indigo-500 ring-2 ring-indigo-300 dark:border-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      ]">
                 <input type="radio" :id="'type-' + option.value" :value="option.value" v-model="applianceType" class="sr-only" />
                 <img :src="option.image" :alt="option.label" class="w-16 h-16 mb-2 object-contain">
                 <span class="text-sm font-medium text-center text-gray-700 dark:text-gray-300">{{ option.label }}</span>
               </label>
             </div>
          </section>

          <!-- Step 3: Fuel Type (Conditional) -->
          <section v-if="step === 3 && ['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType)" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Fuel Type</h2>
             <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
               <label v-for="option in fuelOptions" :key="option.value"
                      :class="[
                        'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out',
                        fuelType === option.value
                          ? 'border-indigo-500 ring-2 ring-indigo-300 dark:border-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      ]">
                 <input type="radio" :id="'fuel-' + option.value" :value="option.value" v-model="fuelType" class="sr-only" />
                 <img :src="option.image" :alt="option.label" class="w-16 h-16 mb-2 object-contain">
                 <span class="text-sm font-medium text-center text-gray-700 dark:text-gray-300">{{ option.label }}</span>
               </label>
             </div>
          </section>
          <!-- Step 3/4 Combined for Microwave Fitting -->
          <section v-if="step === 3 && applianceType === 'Microwave'" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">How is the appliance fitted?</h2>
             <div class="grid grid-cols-2 gap-4">
                <label v-for="option in fittingOptions" :key="option.value"
                       :class="[
                         'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out',
                         fittingType === option.value
                           ? 'border-indigo-500 ring-2 ring-indigo-300 dark:border-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                           : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                       ]">
                  <input type="radio" :id="'fitting-mw-' + option.value" :value="option.value" v-model="fittingType" class="sr-only" />
                  <img :src="option.image" :alt="option.label" class="w-16 h-16 mb-2 object-contain">
                  <span class="text-sm font-medium text-center text-gray-700 dark:text-gray-300">{{ option.label }}</span>
                </label>
             </div>
          </section>

          <!-- Step 4: Fitting Type (Standard Flow) -->
          <section v-if="step === 4 && applianceType !== 'Microwave'" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">How is the appliance fitted?</h2>
             <div class="grid grid-cols-2 gap-4">
                <label v-for="option in fittingOptions" :key="option.value"
                       :class="[
                         'flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-150 ease-in-out',
                         fittingType === option.value
                           ? 'border-indigo-500 ring-2 ring-indigo-300 dark:border-indigo-400 dark:ring-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                           : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                       ]">
                  <input type="radio" :id="'fitting-' + option.value" :value="option.value" v-model="fittingType" class="sr-only" />
                  <img :src="option.image" :alt="option.label" class="w-16 h-16 mb-2 object-contain">
                  <span class="text-sm font-medium text-center text-gray-700 dark:text-gray-300">{{ option.label }}</span>
                </label>
             </div>
          </section>

          <!-- Step 5: Brand -->
          <section v-if="step === 5" class="mb-6 space-y-4">
             <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Appliance Brand</h2>
             <div>
               <label for="brand-make" class="label-modern">Make</label>
               <select id="brand-make" v-model="brand.make" class="input-modern input-modern--select">
                 <option value="" disabled>Select Brand</option>
                 <option v-for="brandName in brands" :key="brandName" :value="brandName">{{ brandName }}</option>
               </select>
             </div>
             <div>
               <label for="brand-model" class="label-modern">Model (Optional)</label>
               <input type="text" id="brand-model" v-model="brand.model" placeholder="Enter Model" class="input-modern" />
             </div>
          </section>

          <!-- Step 6: Fault Info -->
          <section v-if="step === 6" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Fault Information</h2>
             <label for="fault-info" class="label-modern">Describe the issue</label>
             <textarea id="fault-info" v-model="faultInfo" placeholder="Describe the issue with the appliance" rows="4" class="input-modern"></textarea>
          </section>

          <!-- Step 7: User Details -->
          <section v-if="step === 7" class="mb-6 space-y-4">
             <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Your Details</h2>
             <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <label for="first-name" class="label-modern">First Name</label>
                 <input type="text" id="first-name" v-model="userDetails.firstName" required class="input-modern" />
               </div>
               <div>
                 <label for="last-name" class="label-modern">Last Name</label>
                 <input type="text" id="last-name" v-model="userDetails.lastName" required class="input-modern" />
               </div>
             </div>
             <div>
               <label for="phone" class="label-modern">Phone Number</label>
               <input type="tel" id="phone" v-model="userDetails.phone" required class="input-modern" />
             </div>
             <div>
               <label for="email" class="label-modern">Email</label>
               <input type="email" id="email" v-model="userDetails.email" required class="input-modern" />
             </div>
             <div>
               <label for="address" class="label-modern">Address / Location</label>
               <input type="text" id="address" v-model="userDetails.address" required class="input-modern" />
             </div>
             <div>
               <label for="reply-method" class="label-modern">Preferred Reply Method</label>
               <select id="reply-method" v-model="userDetails.replyMethod" required class="input-modern input-modern--select">
                 <option value="" disabled>Select Method</option>
                 <option value="Email">Email</option>
                 <option value="Whatsapp">Whatsapp</option>
                 <option value="Call Back">Call Back</option>
               </select>
             </div>
          </section>

          <!-- Step 8: Preferred Date/Time -->
          <section v-if="step === 8" class="mb-6">
             <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Preferred Date & Time</h2>
             <label for="datetime" class="label-modern">Select Date and Time</label>
             <input type="datetime-local" id="datetime" v-model="preferredDateTime" required class="input-modern" />
          </section>

          <!-- Navigation Buttons -->
          <div class="mt-8 flex justify-between items-center">
            <button type="button" v-if="step > 1" @click="goBack" class="btn-secondary-modern">
              <font-awesome-icon icon="arrow-left" class="mr-1.5" /> Previous
            </button>
            <div v-else></div> <!-- Placeholder to keep Next/Submit button on the right -->

            <button type="button" v-if="step < 8" @click="handleManualNext" class="btn-primary-modern">
              Next <font-awesome-icon icon="arrow-right" class="ml-1.5" />
            </button>
            <button type="submit" v-if="step === 8" class="btn-primary-modern" :disabled="loading">
              <font-awesome-icon icon="check" class="mr-1.5" /> {{ loading ? 'Submitting...' : 'Submit Booking' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
         <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
      </div>

    </div> <!-- End container -->
  </div> <!-- End main div -->
</template>

<style scoped>
/* Import or define modern styles if needed globally */
/* Minimalist Input Styles */
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

/* Modern Button Styles */
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
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Card Style */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}

/* Ensure date/time inputs are stylable */
input[type="date"],
input[type="datetime-local"] {
  @apply appearance-none;
}
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  @apply filter dark:invert opacity-50 cursor-pointer;
}

/* Removed .appliance-options class */

</style>