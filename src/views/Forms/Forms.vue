<script setup>
import axios from "axios";
import Header from "@/components/Header.vue";  
import { useUserStore } from "@/stores/UserStore"
import { onMounted, ref, computed, watch } from "vue";

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

const step = ref(1);
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

const setStepData = () => {
  if (step.value === 1) {
    formData.value.applianceCategory = applianceCategory.value;
  } else if (step.value === 2) {
    formData.value.applianceType = applianceType.value;
  } else if (step.value === 3) {
    formData.value.fuelType = fuelType.value;
  } else if (step.value === 4) {
    formData.value.fittingType = fittingType.value;
  } else if (step.value === 5) {
    formData.value.brand = brand.value;
  } else if (step.value === 6) {
    formData.value.faultInfo = faultInfo.value;
  } else if (step.value === 7) {
    formData.value.userDetails = userDetails.value;
  } else if (step.value === 8) {
    formData.value.preferredDateTime = preferredDateTime.value;
  }
  direction.value = 'forward';
  step.value++;
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

watch([step, applianceCategory], ([newStep, newApplianceCategory]) => {
  if (direction.value === 'forward') {
    // If we're at step 3 and applianceCategory is not 'Cooking', skip to step 4
    if (newStep === 3 && newApplianceCategory !== 'Cooking') {
      formData.value.fuelType = null;
      step.value = 4;
    }
  }
});

</script>

<template>
  <div class="container mx-auto p-4 flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded-lg shadow-lg w-6/12">
      <FormKit type="form" :actions="false" @submit="">
        <!-- Step 1: Appliance Category -->
        <section v-if="step === 1" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">What type of appliance needs repairing?</label>
          <div class="flex flex-wrap gap-4 w-full">
            <div v-for="option in applianceCategoryOptions" :key="option.value" class="w-[23%] p-2 hover:bg-[deepskyblue] active:bg-[deepskyblue] rounded shadow appliance-options">
              <input type="radio" :id="option.value" :value="option.value" v-model="applianceCategory" class="" />
              <label :for="option.value" class="flex flex-col items-center cursor-pointer">
                <img :src="option.image" alt="" class="w-16 h-16">
                <span class="mt-2 text-center">{{ option.label }}</span>
              </label>
            </div>
          </div>
        </section>

        <!-- Step 2: Appliance Type -->
        <section v-if="step === 2" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Select Appliance</label>
          <div class="flex flex-wrap gap-4 w-full">
            <div v-for="option in applianceOptions" :key="option.value" class="w-[23%] p-2 hover:bg-sky-100 rounded shadow appliance-options">
              <input type="radio" :id="option.value" :value="option.value" v-model="applianceType" class="" />
              <label :for="option.value" class="flex flex-col items-center cursor-pointer">
                <img :src="option.image" alt="" class="w-16 h-16">
                <span class="mt-2 text-center">{{ option.label }}</span>
              </label>
            </div>
          </div>          
        </section>

        <!-- Step 3: Fuel Type -->
        <div v-if="step === 3" class="mb-4">
          <label v-if="['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType)" class="block text-gray-700 text-sm font-bold mb-2">Fuel Type</label>
          <div class="flex flex-wrap gap-4 w-full">
            <div v-for="option in fuelOptions" :key="option.value" class="w-[23%] p-2 hover:bg-sky-100 rounded shadow appliance-options">
              <input type="radio" :id="option.value" :value="option.value" v-model="fuelType" class="" v-if="['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType)" />
              <label :for="option.value" v-if="['Oven', 'Cooker', 'Hob', 'CookerHood'].includes(applianceType)" class="flex flex-col items-center cursor-pointer">
                <img :src="option.image" alt="" class="w-16 h-16">
                <span class="mt-2 text-center">{{ option.label }}</span>
              </label>
            </div>
          </div>

          <label v-if="applianceType === 'Microwave' ? step++ : ''" class="block text-gray-700 text-sm font-bold mb-2">How is the appliance fitted?</label>
          <FormKit type="radio" v-if="applianceType === 'Microwave'" v-model="fittingType" :options="['Freestanding', 'Integrated']" class="w-full p-2 border rounded"></FormKit>
        </div>


        <!-- Step 4: How is the Appliance Fitted? -->
        <section v-if="step === 4" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">How is the appliance fitted?</label>
          <div class="flex flex-wrap gap-4 w-full">
            <div v-for="option in fittingOptions" :key="option.value" class="w-[23%] p-2 hover:bg-sky-100 rounded shadow appliance-options">
              <input type="radio" :id="option.value" :value="option.value" v-model="fittingType" class="" />
              <label :for="option.value" class="flex flex-col items-center cursor-pointer">
                <img :src="option.image" alt="" class="w-16 h-16">
                <span class="mt-2 text-center">{{ option.label }}</span>
              </label>
            </div>
          </div>         
        </section>

        <!-- Step 5: Appliance Brand -->
        <section v-if="step === 5" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Appliance Brand</label>
          <FormKit type="select" v-model="brand.make" :options="brands" class="w-full p-2 border rounded mb-2" />
          <FormKit type="text" v-model="brand.model" placeholder="Enter Model" class="w-full p-2 border rounded" />          
        </section>

        <!-- Step 6: Fault Information -->
        <section v-if="step === 6" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Fault Information</label>
          <FormKit type="textarea" v-model="faultInfo" placeholder="Describe the issue with the appliance" class="w-full p-2 border rounded" />          
        </section>

        <!-- Step 7: Your Details -->
        <section v-if="step === 7" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">First Name</label>
          <FormKit type="text" v-model="userDetails.firstName" class="w-full p-2 border rounded mb-2" />
          
          <label class="block text-gray-700 text-sm font-bold mb-2">Last Name</label>
          <FormKit type="text" v-model="userDetails.lastName" class="w-full p-2 border rounded mb-2" />

          <label class="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
          <FormKit type="text" v-model="userDetails.phone" class="w-full p-2 border rounded mb-2" />

          <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
          <FormKit type="email" v-model="userDetails.email" class="w-full p-2 border rounded mb-2" />

          <label class="block text-gray-700 text-sm font-bold mb-2">Address/Location</label>
          <FormKit type="text" v-model="userDetails.address" class="w-full p-2 border rounded mb-2" />

          <label class="block text-gray-700 text-sm font-bold mb-2">How do you want us to reply to you?</label>
          <FormKit type="select" v-model="userDetails.replyMethod" :options="['Email', 'Whatsapp', 'Call Back']" class="w-full p-2 border rounded" />          
        </section>


        <!-- Step 8: Preferred Date and Time -->
        <section v-if="step === 8" class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">Please choose a preferred date and time</label>
          <FormKit type="datetime-local" v-model="preferredDateTime" class="w-full p-2 border rounded" />
        </section>

        <div>
          <!-- Show 'Previous' button only if step is greater than 1 -->
          <button v-if="step > 1" @click="goBack" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Previous</button>
          
          <!-- Show 'Next' button only if step is less than the total number of steps -->
          <button v-if="step < 8" @click="setStepData" class="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Next</button>
          
          <!-- Show 'Submit' button only on the last step -->
          <button v-if="step === 8" @click="submitForm" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Submit</button>
        </div>

      </FormKit>
    </div>
  </div>
</template>

<style scoped>
  .appliance-options {
    border-radius: 0.4rem;
    box-shadow: -5px 25px 17px -20px rgba(0, 0, 0, .5);
    border: 1px solid darkmagenta;
  }

</style>