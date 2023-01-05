<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/UserStore";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { useToast } from "vue-toast-notification";

const loading = ref(false);
const status = ref(null);
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

function resetPassword(credentials) {
  loading.value = true;
  userStore
    .resetPassword({
      ...credentials,
    })
    .then((data) => {
      loading.value = false;
      router.push({ name: "login" });
    })
    .catch((err) => {
      loading.value = false;
      toast.error(err.message);
      console.log(err);
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
  <FormKit
    type="form"
    id="resetPassword"
    submit-label="Reset Password"
    @submit="resetPassword"
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

  
  <div
    v-if="loading"
    class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
  ></div>
</template>
