<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore";
import ScaleLoader from "vue-spinner/src/ScaleLoader.vue";
import { useToast } from "vue-toast-notification";

const loading = ref(false);
const route = useRoute();
const userStore = useUserStore();
const toast = useToast();
const emit = defineEmits(['selectedComponent'])

function forgotPassword(credentials) {
  if(!route.query.token) throw new Error("Invalid reset password token. Please open link from email again!!")
  loading.value = true;
  userStore
    .forgotPassword({
      token: route.query.token,
      ...credentials,
    })
    .then((data) => {
      loading.value = false;      
      emit('selectedComponent', 'LoginUser')
      toast.success('You have successfully reseted your password. Login to continue');
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

  <div>
    <FormKit 
      type="form"
      id="forgotPassword"
      submit-label="Reset Password"
      @submit="forgotPassword"
      :actions="false"
    >
      <h2 class="mb-4 text-2xl text-cyan-900 font-bold">
        Reset your password
      </h2>

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

      <FormKit
        type="password"
        name="password-confirm"
        label="Password Confirm"
        outer-class="text-left"
        validation="required|length:6|matches:/[^a-zA-Z]/"
        :validation-messages="{
          matches: 'Please include at least one symbol',
        }"
        placeholder="Retype password"
      />

      <FormKit type="submit" label="Reset Password" />
      
    </FormKit>
  </div>
  
  <div
    v-if="loading"
    class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"
  ></div>
</template>
