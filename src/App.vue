<script setup>
  import { RouterLink, RouterView } from 'vue-router'
  import AppNav from '@/components/AppNav.vue'
  import GlobalJobViewModal from '@/components/jobs/GlobalJobViewModal.vue'; // Import the global modal
  import { useUserStore } from "@/stores/UserStore"

  const userStore = useUserStore()
</script>


<template>
  <div class="min-h-full">    
    <main>
      <template v-if="userStore.user">
        <app-nav />
      </template>
      <div>
        <router-view :key="$route.fullPath"/>
      </div>
      <!-- Render Global Modals -->
      <GlobalJobViewModal />
    </main>
  </div>
</template>
