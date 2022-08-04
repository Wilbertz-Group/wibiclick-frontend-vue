<template>
  
  <div class="relative py-16
                  before:absolute before:inset-0 before:w-full before:h-[50%] before:bg-gray-200">
      <div class="relative container m-auto px-6 text-gray-500 md:px-12 xl:px-40">

          <div class="m-auto space-y-8 md:w-8/12 lg:w-full">
              <router-link to="/">
                <img src="@/assets/images/wibi-logo.png" loading="lazy" class="w-36 ml-4" alt="tailus logo"> 
              </router-link>
              <div class="rounded-xl border bg-opacity-50 backdrop-blur-2xl bg-white shadow-xl">
                  <div class="lg:grid lg:grid-cols-2">
                      <div class="rounded-lg lg:block" hidden>
                          <img src="@/assets/images/login-office.jpeg" class="object-cover w-full h-full dark:hidden" loading="lazy" height="" width="" alt="music mood">
                      </div>
                      <div class="px-4 py-0 sm:p-10">                          
                          <div class="">
                              <component :is="tabs[loginOrRegister]" />                             

                              <p class="border-t pt-6 text-sm text-center">
                                  
                                  <a
                                    v-show="userStore.newUser"
                                    class="cursor-pointer"
                                    @click="toggleComponent"
                                  > Don't have an account ? <span class="text-sky-500">Try free for 7 Days</span></a>
                                  <a
                                    v-show="!userStore.newUser"
                                    class="cursor-pointer"
                                    @click="toggleComponent"
                                  >Already have an account? <span class="text-sky-500">Login</span></a>
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
  import { computed, ref } from "vue";
  import { useUserStore } from "@/stores/UserStore"
  import LoginUser from '@/components/LoginUser.vue'
  import RegisterUser from '@/components/RegisterUser.vue'

  const userStore = useUserStore()
  const tabs = {
    LoginUser,
    RegisterUser
  }

  const loginOrRegister = computed(() => {
    return userStore.newUser ? 'LoginUser' : 'RegisterUser' 
  })

  function toggleComponent() {
    userStore.isNewUser(!userStore.newUser)
  }
  
</script>

<style scoped>
.auth-link {
  font-size: 1em;
  text-decoration: underline;
  color: #2c3e50;
  cursor: pointer;
}
p.formkit-form{
  text-align: center;
  margin-top: 1%;
}
</style>
