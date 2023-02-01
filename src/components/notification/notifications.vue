<script setup>
import axios from "axios";
import _ from "lodash";
import moment from "moment";
import { useUserStore } from "@/stores/UserStore";
import { ref, onMounted, watchEffect } from "vue";
import timeline from "@/components/timeline.vue";

const show = ref(false);
const notification = ref(null);
const items = ref([]);
const loading = ref(false);
const userStore = useUserStore();
const buttons = {
  whatsapp: {
    name: "Whatsapp",
    icon: "fab fa-whatsapp",
    color: "bg-green-500 hover:bg-green-600",
  },
  messenger: {
    name: "Messenger",
    icon: "fab fa-facebook-messenger",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  mail: {
    name: "Mail",
    icon: "fas fa-envelope",
    color: "bg-red-500 hover:bg-red-600",
  },
  text: {
    name: "Text message",
    icon: "fas fa-comment",
    color: "bg-amber-500 hover:bg-amber-600",
  },
  call: {
    name: "Calls",
    icon: "fas fa-phone",
    color: "bg-black hover:bg-gray-800",
  },
  telegram: {
    name: "Telegram",
    icon: "fab fa-telegram",
    color: "bg-sky-600 hover:bg-sky-700",
  },
  viber: {
    name: "Viber",
    icon: "fab fa-viber",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  skype: {
    name: "Skype",
    icon: "fab fa-skype",
    color: "bg-sky-500 hover:bg-sky-600",
  },
  form: {
    name: "Hubspot",
    icon: "fa-brands fa-hubspot",
    color: "bg-rose-500 hover:bg-rose-600",
  },
};

function notificationHandler(v) {
  show.value = v;
}

async function fetchRecentClicks() {
  try {
    loading.value = true;
    const response = await axios.get(
      "get-recent-clicks?id=" + userStore.currentWebsite
    );

    items.value = response.data.clicks;

    loading.value = false;
  } catch (error) {
    console.log(error);
    loading.value = false;
    toast.error("Error getting website clicks data");
  }
}

onMounted(async () => {
  if (userStore.currentWebsite && userStore.user) {
    fetchRecentClicks();
  }
});
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="py-8">
      <box-icon
        name="bell"
        color="white"
        class="mr-2 mt-2 cursor-pointer notification--bullet relative"
        type="solid"
        @click="notificationHandler(true)"
      ></box-icon>
    </div>

    <div
      class="w-full absolute z-40 right-0 top-0 h-full overflow-x-hidden"
      id="notification"
      ref="notification"
      v-if="show"
    >
      <div
        class="2xl:w-4/12 bg-gray-50 h-full overflow-y-auto p-5 absolute right-0"
      >
        <div class="flex items-center justify-between mb-5">
          <p
            tabindex="0"
            class="focus:outline-none text-2xl font-semibold leading-6 text-gray-800"
          >
            Notifications
          </p>
          <button
            role="button"
            aria-label="close modal"
            class="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md cursor-pointer"
            @click="notificationHandler(false)"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18"
                stroke="#4B5563"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="#4B5563"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <timeline :items="items" :buttons="buttons"></timeline>
        <div v-if="!items.length">No activity recorded yet</div>
      </div>
    </div>
  </div>
  <div
    v-if="show"
    class="bg-gray-900 bg-opacity-80 dark:bg-opacity-80 fixed inset-0 z-30"
  ></div>
</template>

<style></style>
