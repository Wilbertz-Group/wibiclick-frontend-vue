// wibiclick-frontend-vue/src/views/Feedback.vue
<script setup>
  import Header from "@/components/Header.vue";
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted } from "vue";

  const userStore = useUserStore();

  onMounted(() => {
    const script = document.createElement("script");
    script.src = "https://js.hsforms.net/forms/v2.js";
    document.body.appendChild(script);
    script.addEventListener("load", () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          region: "eu1",
          portalId: "26174105",
          formId: "8c5864e5-b30f-48ad-b10e-7cee4f663c81",
          target: "#hubspotForm"
        });
      }
    });
  });
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
      <Header title="Feedback" />
      <div class="flex justify-center mt-10">
        <section class="card-modern w-full max-w-2xl p-0 md:p-8 flex flex-col items-center">
          <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-center">We value your feedback</h2>
          <p class="mb-8 text-gray-600 dark:text-gray-400 text-center max-w-lg">
            Please let us know your thoughts, suggestions, or issues. Your feedback helps us improve our service.
          </p>
          <div id="hubspotForm" v-once class="w-full"></div>
        </section>
      </div>
    </div>
  </div>
</template>
