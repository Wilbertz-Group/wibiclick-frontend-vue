// wibiclick-frontend-vue/src/views/Authenticate.vue
<template>

  <div class="relative py-16 before:absolute before:inset-0 before:w-full before:h-[50%] before:bg-[#101d2d]">
    <div class="relative container m-auto px-6 text-gray-500 md:px-12 xl:px-40">

      <div class="m-auto space-y-8 md:w-8/12 lg:w-full">
        <router-link :to="{name: 'home'}" aria-label="logo" class="flex space-x-2 items-center">
            <div aria-hidden="true" class="flex space-x-1">
              <div class="h-6 w-2 bg-sky-500"></div>
            </div>
            <span class="text-base font-bold text-white">Wibi Click</span>
        </router-link>
        <div class="rounded-xl border backdrop-blur-2xl bg-white shadow-xl">
          <div class="lg:grid lg:grid-cols-2">
            <div class="rounded-lg lg:block" hidden>
              <img src="@/assets/images/login-office.jpeg" class="object-cover w-full h-full dark:hidden rounded-l-lg" loading="lazy"
                height="" width="" alt="music mood">
            </div>
            <div class="px-4 py-0 sm:p-10">
              <div class="">
                <component @selectedComponent="toggleComponent" :is="tabs[selectedComponent]" />

                <p class="pt-6 text-sm text-center">

                  <a v-show="selectedComponent == 'LoginUser'" class="cursor-pointer text-sky-500 mb-5 block" @click="toggleComponent('VerifyEmail')">    
                      Forgot Password
                  </a>
                  <a v-show="selectedComponent == 'LoginUser'" class="cursor-pointer" @click="toggleComponent('RegisterUser')"> Don't have an account ?
                    <span class="text-sky-500">Create an account</span></a>
                  <a v-show="selectedComponent == 'VerifyEmail'" class="cursor-pointer" @click="toggleComponent('LoginUser')"> Remembered your password -
                    <span class="text-sky-500">Click here to login</span></a>
                  <a v-show="selectedComponent == 'RegisterUser'" class="cursor-pointer" @click="toggleComponent('LoginUser')">Already have an
                    account? <span class="text-sky-500">Login</span></a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center space-x-4 hidden">
          <span>&copy; Wibiclick</span>
          <a href="#" class="text-sm hover:text-sky-900">Contact</a>
          <a href="#" class="text-sm hover:text-sky-900">Privacy & Terms</a>
        </div>
      </div>
    </div>
  </div>

</template>

<script setup>
import { onMounted, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/stores/UserStore"
import LoginUser from '@/components/LoginUser.vue'
import RegisterUser from '@/components/RegisterUser.vue'
import VerifyEmail from "../components/verifyEmail.vue";
import ForgotPassword from "../components/ForgotPassword.vue";

const route = useRoute();
const userStore = useUserStore()
const tabs = {
  LoginUser,
  RegisterUser,
  VerifyEmail,
  ForgotPassword
}

const selectedComponent = ref('LoginUser');

const loginOrRegister = computed(() => {
  return userStore.newUser ? 'LoginUser' : 'RegisterUser'
})

function toggleComponent(c) {
  selectedComponent.value = c
}

onMounted(async ()=>{
  if (route.query?.token) {
    selectedComponent.value = 'ForgotPassword'
  }
})

</script>

<style scoped>
.auth-link {
  font-size: 1em;
  text-decoration: underline;
  color: #2c3e50;
  cursor: pointer;
}

p.formkit-form {
  text-align: center;
  margin-top: 1%;
}
</style>
