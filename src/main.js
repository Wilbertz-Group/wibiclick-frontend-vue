import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { plugin, defaultConfig } from '@formkit/vue'
import '@formkit/themes/genesis'
import App from './App.vue'
import axios from "axios";
import router from './router'
import './assets/main.css'
import VueApexCharts from "vue3-apexcharts";
import 'vue3-loading-overlay/dist/vue3-loading-overlay.css';
import 'boxicons'
import ToastPlugin from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueHighlightJS from 'vue-highlightjs'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import 'sweetalert2/dist/sweetalert2.min.css'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas, far, fab)

import Popper from "vue3-popper";

axios.defaults.baseURL = "https://wibi.wilbertzgroup.com/"
//axios.defaults.baseURL = "http://localhost:8080/"

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.component("Popper", Popper);
app.component('font-awesome-icon', FontAwesomeIcon)
app.component('QuillEditor', QuillEditor)
app.use(VueHighlightJS)
app.use(ToastPlugin);
app.use(VueApexCharts);
app.use(plugin, defaultConfig)
app.use(pinia)
app.use(router)

app.mount('#app')
