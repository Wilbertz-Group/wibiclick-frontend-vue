<script setup>
  import { ref } from 'vue'
  import { useRouter } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"  
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import {useToast} from 'vue-toast-notification';

  const loading = ref(false);
  const status = ref(null)
  const userStore = useUserStore()
  const router = useRouter()
  const toast = useToast();

  function login(credentials) {
    loading.value = true
    userStore.login({
      source: "api",
      ...credentials
    })
    .then(() => { loading.value = false; router.push({ name: 'dashboard' }) })
    .catch(err => { 
      loading.value = false; 
      toast.error( err.message);
    })
  }
</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader>
  <FormKit
      type="form"
      id="registration"
      :form-class="submitted ? 'hide' : 'show'"
      submit-label="Login"
      @submit="login"
      :actions="false"
      #default="{ value }"
    >
      <h2 class="text-3xl tracking-tight sm:text-3xl md:text-3xl">Login!</h2>
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

      <FormKit
        type="submit"
        label="Login"
      />

  </FormKit>
</template>
