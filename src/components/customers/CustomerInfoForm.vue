<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  customer: {
    type: Object,
    required: true,
    default: () => ({
      name: "",
      phone: "",
      email: "",
      channel: "",
      address: "",
      message: "",
      hubspotLink: "", // Included though not directly in form
      foreignID: "",
      portal: "",
      // Add other fields if necessary for the form context
    })
  },
  isUpdating: { // Add prop to receive loading state
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update-customer']);

// Use a local ref to manage form data derived from the prop
// This prevents direct mutation of the prop inside FormKit v-model
const formData = ref({});

// Watch the prop and update the local ref when the prop changes
watch(() => props.customer, (newCustomer) => {
  // Create a deep copy to avoid reactivity issues if customer object structure is complex
  formData.value = JSON.parse(JSON.stringify(newCustomer));
}, { immediate: true, deep: true });


function submitForm(credentials) {
  // Emit the current state of formData when FormKit submits
  emit('update-customer', formData.value);
}

</script>

<template>
  <!-- Contact Information Section -->
  <section class="shadow sm:rounded-md sm:overflow-hidden mt-4">
    <div class="p-2 sm:rounded-md sm:overflow-hidden">
        <!-- Use the local formData for v-model -->
        <FormKit type="form" id="customerInfoForm" submit-label="Update" @submit="submitForm" :actions="false" v-model="formData">
          <span class="text-xl font-medium text-gray-900 dark:text-white border-b-4 border-gray-900">About contact</span>
          <div class="mt-4">
            <FormKit type="text" name="name" label="Name" placeholder="--" inner-class="shadow-none" outer-class="text-left border-none" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
            <FormKit type="select" name="channel" label="Reply" placeholder="--" inner-class="shadow-none" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" :options="[ 'Reply me by Email', 'Send me a message on Whatsapp', 'Use any of the above' ]"  />
            <FormKit type="email" name="email" label="Email" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
            <FormKit type="tel" name="phone" label="Phone" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" validation="required|phone" />
            <FormKit type="text" name="portal" label="Portal" inner-class="shadow-none" placeholder="--" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
            <FormKit type="text" name="foreignID" label="Hubspot ID" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
            <FormKit type="text" name="address" label="Address" placeholder="--" inner-class="shadow-none" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />
          </div>

          <FormKit type="textarea" name="message" label="Issue" inner-class="shadow-none" placeholder="--" outer-class="text-left" input-class="pl-0 hover:border-sky-500 hover:ring-1 hover:ring-sky-500" />

          <!-- Disable submit button based on isUpdating prop -->
          <FormKit
            type="submit"
            :input-class="{
              'rounded-full shadow !bg-slate-900 hover:bg-slate-700 text-white': !props.isUpdating,
              'rounded-full shadow !bg-slate-500 text-white opacity-75 cursor-not-allowed': props.isUpdating
            }"
            :label="props.isUpdating ? 'Updating...' : 'Update Customer'"
            :disabled="props.isUpdating"
          />

        </FormKit>
    </div>
  </section>
</template>

<style scoped>
/* Add any component-specific styles here if needed */
</style>