import { defineStore } from 'pinia';
import { ref, watch, onMounted } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const isDarkMode = ref(false);
// Function to apply the theme class to the HTML element
const applyTheme = (darkMode) => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem('darkMode', isDarkMode.value.toString());
    applyTheme(isDarkMode.value);
  };

  // Initialize the theme on store creation/app load
  const initializeTheme = () => {
    const storedDarkMode = localStorage.getItem('darkMode');
    // Check if value exists in localStorage and set initial state
    // Defaults to false (light mode) if not found or invalid
    isDarkMode.value = storedDarkMode === 'true';
    applyTheme(isDarkMode.value);
  };

  // Watch for changes in isDarkMode (though toggleDarkMode already handles persistence and applying theme)
  // This watcher might be redundant given the current setup but can be useful for reacting to external changes if any.
  watch(isDarkMode, (newValue) => {
    // This logic is already in toggleDarkMode, but kept for potential future use cases
    // or if the state could be changed by other means.
    applyTheme(newValue);
    // Ensure localStorage is updated if the state changes unexpectedly outside toggleDarkMode
    if (localStorage.getItem('darkMode') !== newValue.toString()) {
        localStorage.setItem('darkMode', newValue.toString());
    }
  });

  // Use onMounted within the setup function scope if needed,
  // but initialization logic is better placed directly in the setup function body
  // or called from App.vue to ensure it runs early.
  // For this store, direct initialization logic is sufficient.
  // initializeTheme(); // Call initialization directly

  return {
    isDarkMode,
    toggleDarkMode,
    initializeTheme, // Expose initialize function to be called from App.vue
  };
});