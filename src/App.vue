// wibiclick-frontend-vue/src/App.vue
<script setup>
  import { RouterLink, RouterView } from 'vue-router'
  import { onMounted } from 'vue'; // Import onMounted
  import AppNav from '@/components/AppNav.vue'
  import GlobalJobViewModal from '@/components/jobs/GlobalJobViewModal.vue'; // Import the global modal
  import  useUserStore  from "@/stores/UserStore"
  import { useThemeStore } from '@/stores/theme'; // Import the theme store

  const userStore = useUserStore()
  const themeStore = useThemeStore(); // Instantiate the theme store

  // Initialize the theme when the component mounts
  onMounted(() => {
    themeStore.initializeTheme();
  });
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
