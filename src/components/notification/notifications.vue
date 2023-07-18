<script setup>
import axios from "axios";
import _ from "lodash";
import moment from "moment";
import { useUserStore } from "@/stores/UserStore";
import { ref, onMounted, watchEffect } from "vue";
import Ably from "ably";

const show = ref(false);
const notification = ref(null);
const items = ref([]);
const loading = ref(false);
const userStore = useUserStore();
const expandedNotification = ref(null);
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
const ably = new Ably.Realtime(userStore.ableyk);

const removeNotification = (index) => {
  userStore.removenotification(index);
};

const clear = () => {
  userStore.clearnotification();
};

function isDuplicate(notification) {
  return userStore.notifications.some((existingNotification) => existingNotification.message === notification.message);
}

function notificationHandler(v) {
  show.value = !show.value;
}

function toggleExpanded(index) {
  expandedNotification.value = expandedNotification.value === index ? null : index;
}

function timeSince(timestamp) {
  timestamp = new Date(timestamp);
  const now = new Date();
  const secondsPast = (now.getTime() - timestamp.getTime()) / 1000;

  if (secondsPast < 60) {
    return `${Math.floor(secondsPast)} sec ago`;
  }
  if (secondsPast < 3600) {
    return `${Math.floor(secondsPast / 60)} min ago`;
  }
  if (secondsPast < 86400) {
    return `${Math.floor(secondsPast / 3600)} hr ago`;
  }
  return `${Math.floor(secondsPast / 86400)} day(s) ago`;
}

function iniABLY(){
  const channel = ably.channels.get("notifications");
  
  channel.subscribe('notification', function (message) {
    if(message.data?.key == userStore.settings.whatsapp_instance){
      const newNotification = {
        id: userStore.notifications.length + 1,
        profile: 'whatsapp',
        message: message.data?.data,
        time: new Date(),
      };

      if (!isDuplicate(newNotification)) {
        userStore.addnotification(newNotification)        

        //show notification popup
        show.value = true;

        //play sound
        const audio = new Audio('whatsapp.mp3');
        audio.play() 
      }
    }       
  })
}

onMounted(async () => {
  if (userStore.currentWebsite && userStore.user) {
    //iniABLY();
  }
})
</script>

<template>
  <div class="flex items-center justify-center">
    <div class="py-8">
      <box-icon name="bell" color="white" :class=" userStore.notifications.length ? 'notification--bullet' : ''" class="mr-2 mt-2 cursor-pointer relative" type="solid"
        @click="notificationHandler(true)"></box-icon>
    </div>

    <div class="z-40 absolute rounded-lg right-10 top-16 overflow-x-hidden" id="notification" ref="notification"
      v-if="show">
      <div class="w-[300px] sm:w-[350px] float-right bg-[#f8f8ff] right-0 shadow">
        <ul class="!py-0 text-dark dark:text-white-dark w-[300px] sm:w-[350px] divide-y dark:divide-white/10">
          <li>
            <div class="flex items-center px-4 py-2 justify-between font-semibold">
              <h4 class="text-lg">Notification</h4>
              <div v-if="userStore.notifications.length">
                <span class="bg-cyan-900 text-white rounded-lg px-2 py-1 text-sm" v-text="userStore.notifications.length + ' new'"></span>
              </div>
            </div>
          </li>
          <div v-for="notification, index in userStore.notifications" :key="index">
            <li class="dark:text-white-light/90">
              <div class="group flex items-center px-4 py-2">
                <div class="grid place-content-center rounded">
                  <div class="w-12 h-12 relative">
                    <font-awesome-icon class="w-6 h-6 text-white p-2 rounded-full object-cover bg-green-600 hover:bg-green-700 focus:ring-green-800" :icon="buttons[notification.profile].icon" />
                    <span class="bg-success w-2 h-2 rounded-full block absolute right-[6px] bottom-0"></span>
                  </div>
                </div>
                <div class="flex flex-auto">
                  <div class="pr-3 text-sm">
                    <span v-if="expandedNotification === index" v-html="notification.message"></span>
                    <span v-else v-html="notification.message.slice(0, 150)"></span>
                    <span v-if="notification.message.length > 150">
                      <button @click="toggleExpanded(index)" class="text-xs text-cyan-800">{{ expandedNotification === index ? 'View Less' : 'View More' }}</button>
                    </span>
                    <span class="text-xs block font-normal dark:text-gray-500" v-text="timeSince(notification.time)"></span>
                  </div>
                  <button type="button"
                    class="ml-auto rtl:mr-auto text-neutral-300 hover:text-black opacity-0 group-hover:opacity-100"
                    @click="removeNotification(index)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle opacity="0.5" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                      <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          </div>
          <div v-if="userStore.notifications.length">
            <li>
              <div class="p-4">
                <button class="btn btn-primary text-sm block w-full btn-small" @click="clear()">Clear All</button>
              </div>
            </li>
          </div>
          <div v-if="!userStore.notifications.length">
            <li>
              <div class="!grid place-content-center hover:!bg-transparent text-lg min-h-[200px]">
                <div class="mx-auto ring-4 ring-primary/30 rounded-full mb-4 text-primary">
                  <svg width="40" height="40" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path opacity="0.5"
                      d="M20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10Z"
                      fill="currentColor" />
                    <path
                      d="M10 4.25C10.4142 4.25 10.75 4.58579 10.75 5V11C10.75 11.4142 10.4142 11.75 10 11.75C9.58579 11.75 9.25 11.4142 9.25 11V5C9.25 4.58579 9.58579 4.25 10 4.25Z"
                      fill="currentColor" />
                    <path
                      d="M10 15C10.5523 15 11 14.5523 11 14C11 13.4477 10.5523 13 10 13C9.44772 13 9 13.4477 9 14C9 14.5523 9.44772 15 10 15Z"
                      fill="currentColor" />
                  </svg>
                </div>
                No new notifications available.
              </div>
            </li>
          </div>
        </ul>
      </div>

    </div>
  </div>
</template>

<style></style>
