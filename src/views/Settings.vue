<script setup>
import axios from "axios";
import { onMounted, ref, computed } from "vue";
import Header from "@/components/Header.vue";
import Alert from "@/components/Alert.vue";
import { useUserStore } from "@/stores/UserStore"
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { useToast } from 'vue-toast-notification';

const toast = useToast();
const userStore = useUserStore()
const loading = ref(false)

//Tabs
const numbers = ref(true)
const usernames = ref(false)
const messages = ref(false)
const visibility = ref(false)



async function settingsUpdate(credentials) {
  try {
    loading.value = true
    await axios.post('https://wibi.wilbertzgroup.com/update-settings?id='+ userStore.currentWebsite, credentials);
    loading.value = false
    toast.success("Successfully updated the website settings")
  } catch (error) {
    console.log(error)
    toast.error("Error updating website settings")
  }
}

function toggleMenu() {
  numbers.value = false
  usernames.value = false
  messages.value = false
  visibility.value = false
}


</script>

<template>
  <scale-loader :loading="loading" color="#23293b" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <Header title="Widget Settings" />
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">

      <ul class="grid md:grid-cols-4 sm:grid-cols-1 gap-3">
        <li class="w-full">
          <a href="#"
            @click="toggleMenu(); numbers=!numbers"
            :class="!numbers ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fas fa-phone" />
            Numbers
          </a>
        </li>
        <li class="w-full">
          <a href="#"
            @click="toggleMenu(usernames); usernames=!usernames"
            :class="!usernames ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full hover:text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
            <font-awesome-icon icon="fas fa-user" />
            Usernames
          </a>
        </li>
        <li class="w-full">
          <a href="#"
            @click="toggleMenu(messages); messages=!messages"
            :class="!messages ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full bg-white hover:text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
            <font-awesome-icon icon="fas fa-comment" />
            Messages
          </a>
        </li>
        <li class="w-full">
          <a href="#"
            @click="toggleMenu(visibility); visibility=!visibility"
            :class="!visibility ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full bg-white rounded-lg hover:text-gray-700 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">
            <font-awesome-icon icon="fas fa-low-vision" />
            Visibility
          </a>
        </li>
      </ul>

      <div class="shadow sm:rounded-md sm:overflow-hidden mt-2 btn-air-light">
        <!-- Numbers Tab -->
        <FormKit type="form" id="settings-numbers" v-if="numbers" :form-class="numbers ? 'hide w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" #default="{ value }">
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Phone numbers</h3>
            <div class="w-full">
                <FormKit type="text" name="pnumber" label="Phone Number" label-class="text-left" 
                  v-model="userStore.settings.pnumber" />

                <FormKit type="text" name="pnumber_sms" label="Text Message Phone Number" label-class="text-left" 
                  v-model="userStore.settings.pnumber_sms" />

                <FormKit type="text" name="wnumber" label="Whatsapp Phone Number" label-class="text-left" 
                  v-model="userStore.settings.wnumber" />

                <FormKit type="text" name="telegram_num" label="Telegram Phone Number" label-class="text-left" 
                  v-model="userStore.settings.telegram_num" />

                <FormKit type="text" name="viber_num" label="Viber Phone Number" label-class="text-left" 
                  v-model="userStore.settings.viber_num" />

                <!-- <FormKit type="text" name="line" label="Line Phone Number" label-class="text-left" 
                  v-model="userStore.settings.line" /> -->
            </div>

          </div>
          <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Usernames Tab -->
        <FormKit type="form" id="settings-usernames" v-if="usernames" :form-class="usernames ? 'hide w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" #default="{ value }">
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Usernames</h3>
            <div class="w-full">
                <FormKit type="email" name="email" label="Email (send email)" label-class="text-left" validation="email"
                  v-model="userStore.settings.email" />

                <FormKit type="text" name="skype_nameemail" label="Skype (email or username)" label-class="text-left" 
                  v-model="userStore.settings.skype_nameemail" />

                <FormKit type="url" name="messenger_url" label="Messenger (Fb Username)" label-class="text-left" validation="url"
                  v-model="userStore.settings.messenger_url" />
            </div>

          </div>
          <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Messages Tab -->
        <FormKit type="form" id="settings-messages" v-if="messages" :form-class="messages ? 'hide w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" #default="{ value }">
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Messages</h3>
            <div class="w-full">
                <FormKit type="text" name="sms_body" label="Message" label-class="text-left"  v-model="userStore.settings.sms_body" />

                <FormKit type="text" name="whatsapp_message" label="Whatsapp Message" label-class="text-left"  v-model="userStore.settings.whatsapp_message" />

                <FormKit type="text" name="subject" label="Email Subject" label-class="text-left"  v-model="userStore.settings.subject" />

                <FormKit type="textarea" name="body" label="Email Body" label-class="text-left"  v-model="userStore.settings.body" />
            </div>

          </div>
          <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Visibility Tab -->
        <FormKit type="form" id="settings-visibility" v-if="visibility" :form-class="visibility ? 'hide w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" #default="{ value }">
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Select buttons to show</h3>
            <div class="w-full grid md:grid-cols-4 sm:grid-cols-2 gap-3">
                <FormKit v-model="userStore.settings.phone_show" type="checkbox" label="Normal Call" name="phone_show" />

                <FormKit v-model="userStore.settings.text_show" type="checkbox" label="Send a Text Message" name="text_show" />

                <FormKit v-model="userStore.settings.whatsapp_show" type="checkbox" label="Whatsapp" name="whatsapp_show" />

                <FormKit v-model="userStore.settings.messenger_show" type="checkbox" label="Facebook Messenger" name="messenger_show" />

                <FormKit v-model="userStore.settings.telegram_show" type="checkbox" label="Telegram" name="telegram_show" />

                <FormKit v-model="userStore.settings.viber_show" type="checkbox" label="Viber" name="viber_show" />

                <FormKit v-model="userStore.settings.skype_show" type="checkbox" label="Skype" name="skype_show" />

                <!-- <FormKit v-model="userStore.settings.line_show" type="checkbox" label="Line" name="line_show" /> -->

                <FormKit v-model="userStore.settings.email_show" type="checkbox" label="Email Us" name="email_show" />
            </div>

          </div>
          <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>
      </div>

    </div>
  </div>
</template>
