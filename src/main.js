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
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
library.add(fas, far, fab)
axios.defaults.baseURL = "https://wibi.wilbertzgroup.com/"

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(VueHighlightJS)
app.use(ToastPlugin);
app.use(VueApexCharts);
app.use(plugin, defaultConfig)
app.use(pinia)

Sentry.init({
  app,
  dsn: "https://686c73a4bb00415eaf63b145575a9574@o1376965.ingest.sentry.io/6686904",
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracingOrigins: ["localhost", "wibi.co.za", /^\//],
    }),
  ],
  tracesSampleRate: 1.0,
});

app.use(router)

app.mount('#app')
