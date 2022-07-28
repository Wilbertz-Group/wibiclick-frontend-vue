<script setup>
  import { useRouter } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"

  const userStore = useUserStore()
  const router = useRouter()

  function isNew(newUser) { 
    userStore.isNewUser(!newUser) 
  }

  userStore.user ? router.push({ name: 'dashboard' }) : ''

</script>


<template>
  <div v-if="!userStore.user" class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
    <img src="@/assets/images/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" />
    <div class="absolute inset-0 bg-[url(@/assets/images/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="relative bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-lg sm:rounded-lg sm:px-10">
      <div class="mx-auto max-w-md">
        <div class="divide-y divide-gray-300/50">
          <div class="space-y-6 py-8 text-center leading-7 text-black-600">
            <h2 class="text-3xl tracking-tight font-extrabold sm:text-3xl md:text-4xl">Welcome to Wibi Click System</h2>
            <p>An easy way for the website visitor to contact you </p>
          </div>
          <div class="pt-8 font-semibold leading-7 text-center">
            <p class="text-gray-900 pb-4">To use the app, you'll need to</p>
            <p>
            <router-link to="authenticate" class="bg-sky-500 hover:bg-sky-700 px-7 pt-2 pb-3 text-sm leading-5 rounded-full font-semibold text-white" @click.native="isNew(false)">
              Login
            </router-link>
            <span class="px-3">or</span>            
            <router-link to="authenticate" class="bg-sky-500 hover:bg-sky-700 px-5 pt-2 pb-3 text-sm leading-5 rounded-full font-semibold text-white" @click.native="isNew(true)">
              Register
            </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

