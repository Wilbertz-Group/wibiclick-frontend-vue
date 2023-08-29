<script setup>
import axios from "axios";
import { ref } from "vue";
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore"
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { useToast } from 'vue-toast-notification';
import Buttonwidget from "@/components/button_widget.vue";
import * as Ably from 'ably';

const toast = useToast();
const userStore = useUserStore()
const loading = ref(false)
const imgsrc = ref()

//Tabs
const whatsapp = ref(false)
const whatsappweb = ref(false)
const phone = ref(true)
const text = ref(false)
const messenger = ref(false)
const email = ref(false)
const telegram = ref(false)
const viber = ref(false)
const skype = ref(false)
const gads_conversion = ref(false)

let options = { key: 'rSP4cA.1NFKaQ:tVDlfYABKtG3vcm3' };
let client = new Ably.Realtime(options); 
let channel = client.channels.get('feed');

// Subscribe to messages on channel
channel.subscribe('wibiclick', function(message) {
  imgsrc.value = message.data
});

async function settingsUpdate(credentials) {
  try {
    loading.value = true
    await axios.post('update-settings?id='+ userStore.currentWebsite, credentials);
    loading.value = false
    toast.success("Successfully updated the website settings")
  } catch (error) {
    console.log(error)
    toast.error("Error updating website settings")
  }
}

function toggleMenu() {
  whatsapp.value = false
  whatsappweb.value = false
  phone.value = false
  text.value = false
  messenger.value = false
  email.value = false
  telegram.value = false
  viber.value = false
  skype.value = false
  gads_conversion.value = false
}


</script>

<template>
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <Header title="Widget Settings" />
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div v-if="userStore.currentWebsite != 'default'" class="px-4 py-6 sm:px-0 grid md:grid-cols-4 sm:grid-cols-2 gap-3">

      <ul class="col-span-1 md:col-span-1">
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); phone=!phone"
            :class="!phone ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fas fa-phone" />
            Phone
          </a>
        </li>             
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); email=!email"
            :class="!email ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fas fa-envelope" />
            Email
          </a>
        </li>
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); viber=!viber"
            :class="!viber ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-viber" />
            Viber
          </a>
        </li>
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); skype=!skype"
            :class="!skype ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-skype" />
            Skype
          </a>
        </li>
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); telegram=!telegram"
            :class="!telegram ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-telegram" />
            Telegram
          </a>
        </li>        
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); whatsapp=!whatsapp"
            :class="!whatsapp ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-whatsapp" />
            Whatsapp
          </a>
        </li>  
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); text=!text"
            :class="!text ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fas fa-comment" />
            Text Message
          </a>
        </li>
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); messenger=!messenger"
            :class="!messenger ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-facebook-messenger" />
            Facebook Messenger
          </a>
        </li>
        <li class="w-full mb-2 mt-2">
          <a href="#"
            @click="toggleMenu(); whatsappweb=!whatsappweb"
            :class="!whatsappweb ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
            class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
            aria-current="page">
            <font-awesome-icon icon="fab fa-whatsapp" />
            Connect Whatsapp Web
          </a>
        </li> 
        <li class="w-full mb-2 mt-2">
            <a href="#"
                @click="toggleMenu(); gads_conversion=!gads_conversion"
                :class="!gads_conversion ? 'bg-white' : 'bg-sky-100 text-sky-600 rounded-t-lg border-b-2 border-sky-600'"
                class="btn-air-light text-center font-semibold inline-block p-4 w-full text-gray-900 rounded-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white"
                aria-current="page">
                <font-awesome-icon icon="fas fa-ad" />
                Google Ads Conversion
            </a>
        </li> 
      </ul>

      <div class="col-span-1 md:col-span-2 shadow sm:rounded-md sm:overflow-hidden mt-2 btn-air-light">

        <!-- Phone Tab -->
        <FormKit type="form" v-if="phone" :form-class="phone ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Phone Call</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.phone_show" type="checkbox" label="Phone Call Visibility" name="phone_show" />
                
                <FormKit type="text" name="pnumber" label="Phone Number" :validation="userStore.settings.phone_show ? 'required|phone' : ''" label-class="text-left" v-model="userStore.settings.pnumber" />

                <FormKit type="text" name="phoneText" label="Phone Call Button Label" :validation="userStore.settings.phone_show ? 'required' : ''" label-class="text-left"  v-model="userStore.settings.phoneText" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Whatsapp Tab -->
        <FormKit type="form" v-if="whatsapp" :form-class="whatsapp ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Whatsapp Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.whatsapp_show" type="checkbox" label="Whatsapp Visibility" name="whatsapp_show" />

                <FormKit type="text" name="wnumber" label="Whatsapp Phone Number" :validation="userStore.settings.whatsapp_show ? 'required' : ''" label-class="text-left" v-model="userStore.settings.wnumber" />

                <FormKit type="text" name="whatsapp_message" label="Whatsapp Message" :validation="userStore.settings.whatsapp_show ? 'required' : ''" label-class="text-left"  v-model="userStore.settings.whatsapp_message" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Text Message Tab -->
        <FormKit type="form" v-if="text" :form-class="text ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Text Message Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.text_show" type="checkbox" label="Send a Text Message" name="text_show" />

                <FormKit type="text" name="pnumber_sms" label="Text Message Phone Number" :validation="userStore.settings.text_show ? 'required|phone' : ''" label-class="text-left" v-model="userStore.settings.pnumber_sms" />

                <FormKit type="text" name="sms_body" label="Message" label-class="text-left" :validation="userStore.settings.text_show ? 'required' : ''"  v-model="userStore.settings.sms_body" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Facebook Messenger Tab -->
        <FormKit type="form" v-if="messenger" :form-class="messenger ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Facebook Messenger Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.messenger_show" type="checkbox" label="Facebook Messenger" name="messenger_show" />

                <FormKit type="url" name="messenger_url" label="Messenger (https://m.me/yourid)" label-class="text-left" :validation="userStore.settings.messenger_show ? 'required|url' : ''" v-model="userStore.settings.messenger_url" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Email Tab -->
        <FormKit type="form" v-if="email" :form-class="email ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Email Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.email_show" type="checkbox" label="Email Us" name="email_show" />

                <FormKit type="email" name="email" label="Email (send email)" label-class="text-left" :validation="userStore.settings.email ? 'required|email' : ''" v-model="userStore.settings.email" />

                <FormKit type="text" name="subject" label="Email Subject" label-class="text-left" :validation="userStore.settings.email ? 'required' : ''" v-model="userStore.settings.subject" />

                <FormKit type="textarea" name="body" label="Email Body" label-class="text-left" :validation="userStore.settings.email ? 'required' : ''" v-model="userStore.settings.body" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Telegram Tab -->
        <FormKit type="form" v-if="telegram" :form-class="telegram ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Telegram Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.telegram_show" type="checkbox" label="Telegram" name="telegram_show" />

                <FormKit type="text" name="telegram_num" label="Telegram Phone Number" :validation="userStore.settings.telegram_show ? 'required|phone' : ''" label-class="text-left" v-model="userStore.settings.telegram_num" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Viber Tab -->
        <FormKit type="form" v-if="viber" :form-class="viber ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Viber Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.viber_show" type="checkbox" label="Viber" name="viber_show" />

                <FormKit type="text" name="viber_num" label="Viber Phone Number" :validation="userStore.settings.viber_show ? 'required|phone' : ''" label-class="text-left" v-model="userStore.settings.viber_num" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Skype Tab -->
        <FormKit type="form" v-if="skype" :form-class="skype ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Edit Skype Settings</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.skype_show" type="checkbox" label="Skype" name="skype_show" />

                <FormKit type="text" name="skype_nameemail" label="Skype (email or username)" :validation="userStore.settings.skype_show ? 'required' : ''" label-class="text-left" v-model="userStore.settings.skype_nameemail" />
            </div>

          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

        <!-- Whatsapp Tab -->
        <FormKit type="form" v-if="whatsappweb" :form-class="whatsappweb ? 'w-full' : 'show w-full'"  submit-label="Update"
          :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Scan Whatsapp QR Code</h3>
            <div class="w-full">
              <img v-if="imgsrc" :src="imgsrc" />
              <p v-else class="text-xs font-medium leading-6 m-6 text-center" >We will display the QR Code once received</p>
            </div>

          </div>
        </FormKit>

        <!-- Google Ads Conversion Tab -->
        <FormKit type="form" v-if="gads_conversion" :form-class="gads_conversion ? 'w-full' : 'show w-full'"  submit-label="Update"
          @submit="settingsUpdate" :actions="false" >
          <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
            <h3 class="text-2xl font-semibold text-gray-700">Google Ads Conversion Tracking</h3>
            <div class="w-full">
                <FormKit v-model="userStore.settings.gads_track" type="checkbox" label="Enable Tracking" name="gads_track" />

                <FormKit type="text" name="gads_id" label="Conversion ID" :validation="userStore.settings.gads_track ? 'required' : ''" label-class="text-left" v-model="userStore.settings.gads_id" />
                
                <FormKit type="text" name="gads_label" label="Conversion Label" :validation="userStore.settings.gads_track ? 'required' : ''" label-class="text-left" v-model="userStore.settings.gads_label" />
            </div>
          </div>
          <div class="px-4 py-3 text-right sm:px-6">
            <FormKit type="submit" label="Update" />
          </div>
        </FormKit>

      </div>

      <div>
        <Buttonwidget/>
      </div>

    </div>
    <h3 class="text-lg font-medium leading-6 text-red-600 m-6 text-center" v-else>You need to select or add a website on the top header to change widget settings!!!</h3>
    
  </div>
  <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>
