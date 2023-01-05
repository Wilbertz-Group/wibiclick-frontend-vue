<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/UserStore"
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'

const loading = ref(false)
const status = ref(null)
const userStore = useUserStore()
const router = useRouter()

async function register(credentials) {
  loading.value = true
  userStore.register({
    ...credentials
  })
    .then(() => {
      loading.value = false;
    })
    .catch(err => {
      loading.value = false;
      console.log(err)
    })
}

</script>

<template>
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <div>
    <FormKit type="form" id="registration" :form-class="submitted ? 'hide' : 'show'" submit-label="Register"
      @submit="register" :actions="false" >
      <h2 class="mb-4 text-2xl text-cyan-900 font-bold">Start your free trial with 1000 credits. <span
          class="text-base block">No credit card needed. Signup and start using it</span></h2>
      <hr />

      <div class="double">
        <FormKit type="text" name="firstName" label="First Name" placeholder="Jane" outer-class="text-left"
          validation="required" />
        <FormKit type="text" name="lastName" label="Last Name" placeholder="Doe" outer-class="text-left"
          validation="required" />
      </div>

      <div class="double">
        <FormKit type="text" name="email" label="Email" placeholder="jane@company.com" outer-class="text-left"
          validation="required|email" />
        <FormKit type="text" name="company" label="Company" placeholder="Company Name" outer-class="text-left"
          validation="required" />
      </div>

      <div class="double">
        <FormKit type="password" name="password" label="Password" placeholder="********" outer-class="text-left"
          validation="required|length:6|matches:/[^a-zA-Z]/" :validation-messages="{
            matches: 'Please include at least one symbol',
          }" />
        <FormKit type="password" name="password_confirm" label="Confirm password" placeholder="********"
          outer-class="text-left" validation="required|confirm" />
      </div>

      <FormKit type="checkbox" label="Marketing Emails" name="marketing" outer-class="text-left" />

      <FormKit type="checkbox" name="policy" label="I agree to the Terms of Service and Privacy Policy."
        outer-class="text-left" validation="accepted" validation-visibility="dirty" />

      <FormKit type="submit" label="Register" />

    </FormKit>
  </div>
  <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>


