<!-- wibiclick-frontend-vue/src/components/verifyEmail.vue -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import  useUserStore  from "@/stores/UserStore";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { useToast } from "vue-toast-notification";

const loading = ref(false);
const status = ref(false);
const userStore = useUserStore();
const toast = useToast();
const emit = defineEmits(['selectedComponent'])

function verifyEmail(credentials) {
  loading.value = true;
  userStore
    .verifyEmail({
      ...credentials,
    })
    .then((data) => {
      loading.value = false;
      toast.success('Please check your email for the password reset link');
      // emit('selectedComponent', 'LoginUser')
      status.value = true
    })
    .catch((err) => {
      loading.value = false;
      toast.error(err);
      // Removed console.log
    });
}
</script>

<template>
  <scale-loader
    :loading="loading"
    color="#ffffff"
    height="50px"
    class="vld-overlay is-active is-full-page"
    width="6px"
  ></scale-loader>

  <div v-show="!status">
    <FormKit 
      type="form"
      id="verifyEmail"
      submit-label="Reset Password"
      @submit="verifyEmail"
      :actions="false"
    >
      <h2 class="mb-4 text-2xl text-cyan-900 font-bold">
        Reset your password
      </h2>

      <FormKit
        type="text"
        name="email"
        label="Email"
        outer-class="text-left"
        placeholder="Email that you login with"
        validation="required|email"
      />

      <FormKit type="submit" label="Reset Password" />
      
    </FormKit>
  </div>

  <h2 v-show="status" class="mb-4 mt-20 text-xl text-cyan-900 font-bold">
    Please check your email for the password reset link
  </h2>
  
  <div
    v-if="loading"
    class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
  ></div>
</template>
