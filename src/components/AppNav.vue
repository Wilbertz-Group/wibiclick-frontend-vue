<script setup>
import axios from "axios";
import { useUserStore } from "@/stores/UserStore"
import { 
  Disclosure, 
  DisclosureButton, 
  DisclosurePanel, 
  Menu, MenuButton, 
  MenuItem, 
  MenuItems,
  Listbox,
  ListboxLabel,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'

import { ref, onMounted, watchEffect } from "vue";
import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
import { useToast } from 'vue-toast-notification';
import Ably from "ably";

const toast = useToast();
const userStore = useUserStore()
const addModal = ref(false)
const submitted = ref(false)
const selectedWebsite = ref(userStore.currentWebsite)
const loading = ref(false)
const analytics = ref({})
const dropdownContacts = ref(false)
const dropdownMarketing = ref(false)
const dropdownSales = ref(false)
const unreadNotifications = ref([]);
const ably = new Ably.Realtime(userStore.ableyk);


const opt = ref([
  { label: 'Select Website', value: 'default', attrs: { disabled: true } },
])

const people = [
    { id: 1, name: 'Durward Reynolds', unavailable: false },
    { id: 2, name: 'Kenton Towne', unavailable: false },
    { id: 3, name: 'Therese Wunsch', unavailable: false },
    { id: 4, name: 'Benedict Kessler', unavailable: true },
    { id: 5, name: 'Katelyn Rohan', unavailable: false },
  ]

const selectedPerson = ref(people[0])

function logout() {
  userStore.$reset()
  localStorage.removeItem('user')
  localStorage.removeItem('UserStore')
  location.reload()
}

async function fetchWebsites(n) {
  try {
    loading.value = true
    const response = await axios.get('get-websites');
    opt.value = [{ label: 'Select Website', value: 'default'}].concat(response.data)
    if (response.data.length && selectedWebsite.value != 'default') {
      userStore.updateWebsite(selectedWebsite.value)
      fetchWebsiteAnalytics(selectedWebsite.value);
      fetchSettings(selectedWebsite.value);
    }
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.error("Error getting website data")
  }
}

async function fetchWebsiteAnalytics(id) {
  try {
    loading.value = true
    const response = await axios.get('get-website-analytics?id=' + id);
    analytics.value = response.data.analytics[0]
    userStore.updateAnalytics(analytics.value)
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.error("Error getting website analytics data")
  }
}

async function fetchSettings(id) {
  try {
    loading.value = true
    const response = await axios.get('get-website?id=' + id);
    userStore.updateSettings(response.data.setting)
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.error("Error getting website settings")
  }
}

async function addWebsite(credentials) {
  try {
    addModal.value = false
    loading.value = true
    await axios.post('add-website', { url: credentials.newWebsite });
    fetchWebsites();
    toast.success("Website added successfully")
    loading.value = false
  } catch (error) {
    console.log(error)
    toast.error('Error Adding website')
  }
}

function playSound () {
  const audio = new Audio('notification.mp3');
  audio.play();
}

function iniABLY(){
  const channel = ably.channels.get("notifications");
  
  channel.subscribe('wibi', function (message) {
    unreadNotifications.value.push(
      { 
        index    : unreadNotifications.value.length,
        title    : message.data?.name,
        msg      : message.data?.data,
        img      : message.data?.image_url,
        time     : randomDate({sec: 0}),
        website_id : message.data?.website
      }
    )

    toast.success(message.data.data, {
      duration: 2000
    })

    playSound()

    let optns = {
      body: message.data.data,
      icon: message.data.image_url
    }

    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      const notification = new Notification(message.data.name, optns);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          const notification = new Notification(message.data.name, optns);
        }
      });
    }
    
  });

    

}

function elapsedTime(startTime) {
  let x        = new Date(startTime)
  let now      = new Date()
  var timeDiff = now - x
  timeDiff    /= 1000

  var seconds = Math.round(timeDiff)
  timeDiff    = Math.floor(timeDiff / 60)

  var minutes = Math.round(timeDiff % 60)
  timeDiff    = Math.floor(timeDiff / 60)

  var hours   = Math.round(timeDiff % 24)
  timeDiff    = Math.floor(timeDiff / 24)

  var days    = Math.round(timeDiff % 365)
  timeDiff    = Math.floor(timeDiff / 365)

  var years   = timeDiff

  if (years > 0) {
    return years + (years > 1 ? ' Years ' : ' Year ') + 'ago'
  } else if (days > 0) {
    return days + (days > 1 ? ' Days ' : ' Day ') + 'ago'
  } else if (hours > 0) {
    return hours + (hours > 1 ? ' Hrs ' : ' Hour ') + 'ago'
  } else if (minutes > 0) {
    return minutes + (minutes > 1 ? ' Mins ' : ' Min ') + 'ago'
  } else if (seconds > 0) {
    return seconds + (seconds > 1 ? ' sec ago' : 'just now')
  }

  return 'Just Now'
}

// Method for creating dummy notification time
function randomDate({ hr, min, sec }) {
  let date = new Date()

  if (hr) date.setHours(date.getHours() - hr)
  if (min) date.setMinutes(date.getMinutes() - min)
  if (sec) date.setSeconds(date.getSeconds() - sec)

  return date
}

onMounted(() => {
  if (!userStore.user) {
    logout()
  } else {
    iniABLY();
    fetchWebsites();
  }
}),

  watchEffect(() => {
    fetchWebsites(selectedWebsite.value)
  })
</script>

<template>
  <scale-loader :loading="loading" color="#ffffff" height="50px" class="vld-overlay is-active is-full-page" width="6px">
  </scale-loader>
  <Disclosure as="nav" class="bg-custom-gray custom-css-cal" v-slot="{ open }">
    <div class=" mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center">

          <div class="flex-shrink-0">
            <a href="#" aria-label="logo" class="flex space-x-2 items-center">
              <div aria-hidden="true" class="flex space-x-1">
                <div class="h-6 w-2 bg-sky-500"></div>
              </div>
              <span class="text-base font-bold text-white">Wibi Click</span>
            </a>
          </div>

          <div class="hidden md:block">
            <div class="ml-10 flex items-center space-x-4">              
              
              <div class="relative">
                <!-- Contacts dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='user-circle'></box-icon>
                        Contacts 
                        <svg :class="dropdownContacts ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'contacts'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user-detail'></box-icon>
                          <span class="ml-2">Contacts</span>
                        </router-link>  
                        <router-link :to="{name: 'employees'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user'></box-icon>
                          <span class="ml-2">Employees</span>
                        </router-link>                      
                        <router-link :to="{name: 'users'}" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type="solid" name='user-account'></box-icon>
                          <span class="ml-2">Users</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>                
              </div>

              <div class="relative" v-if="userStore.user.permission == 'owner'">
                <!-- Marketing dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='store'></box-icon>
                        Marketing 
                        <svg :class="dropdownMarketing ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'visitors'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='user-check'></box-icon>
                          <span class="ml-2">Visitors</span>
                        </router-link>
                        <router-link :to="{name: 'pages'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='book-content'></box-icon>
                          <span class="ml-2">Pages</span>
                        </router-link>
                        <router-link :to="{name: 'forms'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='book'></box-icon>
                          <span class="ml-2">Forms</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>

              <div class="relative" >
                <!-- Sales dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='cart-download'></box-icon>
                        Sales
                        <svg :class="dropdownSales ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'jobs'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='business'></box-icon>
                          <span class="ml-2">Jobs</span>
                        </router-link>
                        <router-link :to="{name: 'estimates'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" name='receipt'></box-icon>
                          <span class="ml-2">Estimates</span>
                        </router-link>
                        <router-link :to="{name: 'invoices'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='receipt'></box-icon>
                          <span class="ml-2">Invoices</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>  
              </div>

              <div class="relative" >
                <!-- Reports dropdown -->
                <Menu as="div" class="ml-3 relative">
                  <div>
                    <MenuButton>
                      <div class="flex items-center text-white px-3 py-2 rounded-md text-sm font-medium relative">
                        <box-icon color="white" class="mr-2" type="solid" name='analyse'></box-icon>
                        Reports
                        <svg :class="dropdownSales ? 'rotate-180': ''" class="ml-2 w-4 h-4 float-right right-0 relative" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </MenuButton>
                  </div>
                  <transition enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95">
                    <MenuItems>
                      <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                        class="origin-top-right absolute right-0 mt-2 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <router-link :to="{name: 'insurance-reports'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium hover:underline">
                          <box-icon color="black" type='solid' name='business'></box-icon>
                          <span class="ml-2">Insurance</span>
                        </router-link>
                        <router-link :to="{name: 'dashboard'}" class="flex items-center text-slate-900 px-3 py-2 rounded-md text-sm font-medium">
                          <box-icon type='solid' color="black" name='dashboard'></box-icon>
                          <span class="ml-2">Analytics</span>
                        </router-link>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>  
              </div>

              
            </div>
          </div>
        </div>

        <div class="hidden md:block">
          <div class="ml-4 flex items-center md:ml-6">            
            <div class="relative w-52 mr-5">              
              <Listbox v-model="selectedWebsite">
              <div class="relative mt-1">
                <ListboxButton
                  class="relative w-full cursor-default rounded-lg bg-white py-1 pl-3 pr-3 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate"> {{ opt.filter(a => a.value == selectedWebsite)?.length && selectedWebsite ? opt.filter(a => a.value == selectedWebsite)[0].label : '' }}</span>
                  <span
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                    </svg>
                  </span>
                </ListboxButton>

                <transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                      v-slot="{ active, selected }"
                      v-for="website in opt"
                      :key="website.label"
                      :value="website.value"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                        >
                          {{ website.label }}</span>
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                        >
                          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>

                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>
            </div>            

            <p class="text-white text-sm">Hello, {{ userStore.user.firstName }}.</p>

            <!-- Profile dropdown -->
            <Menu as="div" class="ml-3 relative">
              <div>
                <MenuButton
                  class="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                  <span class="sr-only">Open user menu</span>
                  <div class="overflow-hidden relative w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg class="absolute -left-1 w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"></path>
                    </svg>
                  </div>
                </MenuButton>
              </div>
              <transition enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95">
                <MenuItems
                  class="origin-top-right absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div aria-labelledby="headlessui-menu-button-3" id="headlessui-menu-items-4" role="menu" tabindex="0"
                    class="origin-top-right absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <router-link :to="{name: 'profile'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Your Profile</router-link>
                    <router-link :to="{name: 'billing'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Billing & Usage</router-link>
                    <router-link :to="{name: 'snippet'}" v-if="userStore.user.role == 'admin' && userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Snippet</router-link>
                    <router-link :to="{name: 'feedback'}" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Feedback</router-link>
                    <router-link :to="{name: 'settings'}" v-if="userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Settings</router-link>
                    <div @click="addModal = true" v-if="userStore.user.permission == 'owner'" class="block px-4 py-2 text-sm text-gray-700 cursor-pointer" disabled="false"
                      id="headlessui-menu-item-20" role="menuitem" tabindex="-1">Add Website</div>                    
                    <a href="#" @click="logout" class="block px-4 py-2 text-sm text-gray-700" disabled="false"
                      id="headlessui-menu-item-22" role="menuitem" tabindex="-1">Sign out</a>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>

        <div class="-mr-2 flex md:hidden">
          <!-- Mobile menu button -->
          <DisclosureButton
            class="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
            <span class="sr-only">Open main menu</span>
            <svg v-if="!open" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>

            <svg v-else class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </DisclosureButton>
        </div>
      </div>
    </div>

    <DisclosurePanel class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <router-link :to="{name: 'dashboard'}" disabled="false"
          class="text-white block px-3 py-2 rounded-md text-base font-medium"> Dashboard </router-link>
        <router-link :to="{name: 'settings'}" v-if="userStore.user.permission == 'owner'" disabled="false" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Settings </router-link>
        <router-link :to="{name: 'employees'}" disabled="false" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Employees </router-link>
        <router-link :to="{name: 'users'}" v-if="userStore.user.role == 'admin'" disabled="false" class="text-white block px-3 py-2 rounded-md text-base font-medium">
          Users </router-link>
        <!-- <a disabled="false" href="#" class="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium">FAQ</a> -->
      </div>

      <div class="pt-4 pb-3 border-t border-gray-700">
        <box-icon @click="addModal = true" type='solid' name='plus-circle'
          class="text-white cursor-pointer mx-2 h-6 w-6 rounded-full bg-white"></box-icon>
        <div class="relative flex items-center px-5 pb-6">
          <FormKit type="select" name="website" placeholder="select website" inner-class="selectClass"
            v-model="selectedWebsite" :options="opt">
          </FormKit>
          <font-awesome-icon icon="far fa-arrow-alt-circle-down" class="downarrow absolute" />
        </div>
        <div class="flex items-center px-5">
          <div class="flex-shrink-0">
            <div class="overflow-hidden relative w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-600">
              <svg class="absolute -left-1 w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd">
                </path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <div class="text-base font-medium leading-none text-white">{{ userStore.user.firstName }}</div>
            <div class="text-sm font-medium leading-none text-gray-400">{{ userStore.user.email }}</div>
          </div>
        </div>
        <div class="mt-3 px-2 space-y-1">
          <div class="mt-3 px-2 space-y-1">
            <router-link :to="{name: 'profile'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Your Profile</router-link>
            <router-link :to="{name: 'billing'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Billing
              & Usage</router-link>
            <router-link :to="{name: 'snippet'}" v-if="userStore.user.permission == 'owner'" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Snippet</router-link>
            <router-link :to="{name: 'feedback'}" disabled="false"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">
              Feedback</router-link>
            <a disabled="false" @click="logout" href="#"
              class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Sign
              out</a>
          </div>
        </div>
      </div>
    </DisclosurePanel>
  </Disclosure>

  <!-- Add Website modal -->
  <div id="addModal" tabindex="-1" :class="{ flex: addModal, hidden: !addModal }"
    class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl h-full md:h-auto">
      <!-- Modal content -->
      <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <!-- Modal header -->
        <div class="flex justify-between items-start p-4 rounded-t border-b dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Add a new website
          </h3>
          <button ref="closeDefaultModal" type="button"
            class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
            @click="addModal = false">
            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <FormKit type="form" id="profile" :form-class="submitted ? 'hide' : 'show'" submit-label="Create"
            @submit="addWebsite" :actions="false" #default="{}">
            <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div class="w-full">
                <div class="">
                  <FormKit type="url" name="newWebsite" label="Website URL" label-class="text-left"
                    validation="required|url" help="Which website do you want to add?"
                    placeholder="https://www.google.com" />
                </div>
              </div>

            </div>
            <div class="text-right">
              <FormKit type="submit" label="Add" />
            </div>
          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="addModal" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
  <div v-if="loading" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</template>

<style>
.bg-blueGray-800 {
  --tw-bg-opacity: 1;
  background-color: rgba(30, 41, 59, var(--tw-bg-opacity));
}

.custom-css-cal .selectClass select.formkit-input {
  color: white;
  --tw-bg-opacity: 1;
  background-color: rgba(30, 41, 59, var(--tw-bg-opacity));
  max-width: 17vw;
}

.custom-css-cal .formkit-outer {
  margin: 0 15px 0 0;
}

.custom-css-cal svg.downarrow {
  right: 20px;
  top: 14px;
  color: white;
}

.custom-css-cal select.formkit-input option {
  box-sizing: border-box;
  color: white !important;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 450px) {
  .custom-css-cal .formkit-outer {
    margin: 0;
    width: 100%;
  }

  .custom-css-cal svg.downarrow {
    right: 32px;
  }
}
</style>