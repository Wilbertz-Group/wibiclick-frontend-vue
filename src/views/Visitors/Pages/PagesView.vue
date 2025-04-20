<template>
  <div :class="{ 'dark': themeStore.isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-14 space-y-4 md:space-y-0">
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
          <font-awesome-icon icon="file-alt" class="mr-3 text-indigo-500 dark:text-indigo-400" />
          Visitor Pages
        </h1>
        <div class="flex items-center space-x-2 sm:space-x-3">
          <button @click="fetchPages" class="btn-icon-modern" title="Reload Pages" :disabled="isLoadingPages">
            <font-awesome-icon icon="sync" :class="{ 'fa-spin': isLoadingPages }" />
          </button>
          <button @click="themeStore.toggleDarkMode" class="btn-icon-modern" title="Toggle Dark Mode">
            <font-awesome-icon :icon="themeStore.isDarkMode ? 'sun' : 'moon'" />
          </button>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Sidebar: Page List -->
        <section class="md:col-span-1 card-modern p-5 sm:p-6 flex flex-col">
          <div class="mb-4">
            <input
              v-model="search"
              placeholder="Search pages..."
              class="input-modern"
              type="text"
            />
          </div>
          <PageList
            :pages="filteredPages"
            :loading="isLoadingPages"
            :selectedPageId="selectedPageId"
            @select="handleSelectPage"
          />
        </section>

        <!-- Main Panel: Page Details -->
        <section class="md:col-span-2 card-modern p-5 sm:p-6 min-h-[300px]">
          <PageDetailView
            v-if="selectedPage"
            :page="selectedPage"
          />
          <div v-else class="text-gray-500 dark:text-gray-400 text-center mt-10">
            Select a page to view details.
          </div>
        </section>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isLoadingPages" class="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 dark:bg-opacity-80 flex items-center justify-center">
        <scale-loader :loading="true" color="#4f46e5" height="40px" width="5px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import PageList from "./PageList.vue";
import PageDetailView from "./PageDetailView.vue";
import { useUserStore } from "@/stores/UserStore";
import { useThemeStore } from '@/stores/theme';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faFileAlt, faSync, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue';

const pages = ref([]);
const isLoadingPages = ref(false);
const selectedPageId = ref(null);
const search = ref("");

const userStore = useUserStore();
const themeStore = useThemeStore();

const selectedPage = computed(() =>
  pages.value.find((p) => p.id === selectedPageId.value)
);

const filteredPages = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return pages.value;
  return pages.value.filter(
    (p) =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.url && p.url.toLowerCase().includes(q))
  );
});

const fetchPages = async () => {
  isLoadingPages.value = true;
  try {
    const websiteId = userStore.currentWebsite;
    const res = await axios.get(`/api/pages?websiteId=${encodeURIComponent(websiteId)}`);
    pages.value = res.data;
  } catch (e) {
    pages.value = [];
  } finally {
    isLoadingPages.value = false;
  }
};

const handleSelectPage = (id) => {
  selectedPageId.value = id;
};

onMounted(() => {
  fetchPages();
});
</script>

<style scoped>
/* Modern utility classes are used for layout and style. */
.card-modern {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm;
}
.input-modern {
  @apply block w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500;
  @apply focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400;
  @apply transition duration-150 ease-in-out;
}
.btn-icon-modern {
  @apply inline-flex items-center justify-center w-8 h-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600/50 rounded-md shadow-sm;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400;
  @apply transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>