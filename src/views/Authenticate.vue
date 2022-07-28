<template>
  <div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
    <img src="@/assets/images/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" />
    <div class="absolute inset-0 bg-[url(@/assets/images/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
      <div class="mx-auto max-w-md">
        <div class="divide-y divide-gray-300/50">
          <div class="space-y-6 py-1 text-center leading-7 text-black-600">            
            <component :is="tabs[loginOrRegister]" />
          </div>
          <div class="pt-4 font-semibold leading-7 text-center">            
            <p class="formkit-form">
              <a
                v-show="userStore.newUser"
                class="auth-link"
                @click="toggleComponent"
              >Don't have an account? Create one.</a>
              <a
                v-show="!userStore.newUser"
                class="auth-link"
                @click="toggleComponent"
              >Already have an account? Login.</a>
            </p>
          </div>
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
