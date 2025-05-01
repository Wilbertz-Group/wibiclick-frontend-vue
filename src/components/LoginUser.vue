<!-- wibiclick-frontend-vue/src/components/LoginUser.vue -->
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

function login(credentials) {
  loading.value = true;
  userStore
    .login({
      source: "api",
      ...credentials,
    })
    .then((data) => {
      loading.value = false;
      router.push({ name: "jobs" });
    })
    .catch((err) => {
      loading.value = false;
      toast.error(err.message);
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
  <FormKit
    type="form"
    id="registration"
    submit-label="Login"
    @submit="login"
    :actions="false"
  >
    <h2 class="mb-4 text-2xl text-cyan-900 font-bold">
      Sign in to your account
    </h2>
    <hr />
    <FormKit
      type="text"
      name="email"
      label="Email"
      outer-class="text-left"
      placeholder="jane@example.com"
      validation="required|email"
    />
    <FormKit
      type="password"
      name="password"
      label="Password"
      outer-class="text-left"
      validation="required|length:6|matches:/[^a-zA-Z]/"
      :validation-messages="{
        matches: 'Please include at least one symbol',
      }"
      placeholder="Your password"
    />

    <FormKit type="submit" label="Login" />
    
  </FormKit>

  
  <div
    v-if="loading"
    class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
  ></div>
</template>
