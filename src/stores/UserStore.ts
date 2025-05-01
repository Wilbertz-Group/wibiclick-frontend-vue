// wibiclick-frontend-vue/src/stores/UserStore.ts
import { defineStore } from "pinia";
import axios from "axios";
import { useToast } from "vue-toast-notification";

const toast = useToast();

interface User {
  token?: string;
  [key: string]: any;
}

interface Settings {
  gtm_container_id: string;
  [key: string]: any;
}

interface Analytics {
  [key: string]: any;
}

interface Notification {
  [key: string]: any;
}

interface UserStoreState {
  user: User | null;
  rtlClass: string;
  ableyk: string;
  events: string;
  newUser: boolean;
  analytics: Analytics;
  notifications: Notification[];
  currentWebsite: string;
  settings: Settings;
  gtm_container_id: string;
  websites: any[];
  status: string[];
}

const useUserStore = defineStore({
  id: "UserStore",
  state: (): UserStoreState => ({
    user: null,
    rtlClass: 'ltr',
    ableyk: '58qyVA.oZmMMA:EFhE0xzGmbBhHdWDNYcu-qD2UjuKNYj2wcotHQo1FiY',
    events: '',
    newUser: true,
    analytics: {},
    notifications: [],
    currentWebsite: "default",
    settings: {
      gtm_container_id: ''
    },
    gtm_container_id: '',
    websites: [],
    status: [
      'AI-Draft',
      'scheduled',
      'quoting', 
      'quoted', 
      'no parts', 
      'accepted',     
      'cancelled',
      'pending',
      'invoiced',
      'follow-up',
      'done',
      'paid',
      'to order parts',
      'parts ordered',
      'parts arrived',
      'parts installed',
      'parts paid',
      'parts not paid',
      'parts not installed',
      'parts not ordered',
      'parts not available',
      'parts not needed',
      'parts not found',
      'waiting for price',
      'waiting for parts',
      'waiting for customer',
      'waiting for payment'
    ]
  }),
  getters: {
    // Example: lastName: (state) => state.user?.name?.split(' ')[1] ?? ''
  },
  actions: {
    async register(credentials: Record<string, any>) {
      try {
        const response = await axios.post("register", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        this.user = response.data;
        toast.success("You are successfully Registered");
      } catch (error: any) {
        toast.error(error.message);
      }
    },
    async verifyEmail(credentials: Record<string, any>) {
      try {
        await axios.post("verify-email", credentials);
      } catch (error: any) {
        toast.error(error.message);
      }
    },
    async forgotPassword(credentials: Record<string, any>) {
      try {
        await axios.post("password-reset", credentials);
      } catch (error: any) {
        toast.error(error.message);
      }
    },
    async login(credentials: Record<string, any>) {
      try {
        const response = await axios.post("login", credentials);
        if (response.data?.token) {
          localStorage.setItem("user", JSON.stringify(response.data));
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${response.data.token}`;
          this.user = response.data;
          toast.success("You are successfully logged in");
        }
      } catch (error: any) {
        toast.error(
          error.message?.includes("status code 401")
            ? "Invalid login details"
            : error.message
        );
      }
    },
    async updateLogin(credentials: Record<string, any>) {
      try {
        const response = await axios.post("update-login", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
        this.user = response.data;
      } catch (error: any) {
        toast.error(error?.message);
      }
    },
    async updateProfile(credentials: Record<string, any>) {
      try {
        const response = await axios.post("profile", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
        this.user = response.data;
      } catch (error: any) {
        toast.error(error?.message);
      }
    },
    async addWebsite(credentials: Record<string, any>) {
      try {
        await axios.post("add-website", credentials);
      } catch (error: any) {
        toast.error(error?.message);
      }
    },
    setWebsites(websites: any[]) {
      this.websites = websites;
    },
    isNewUser(newUser: boolean) {
      this.newUser = newUser;
    },
    updateUser(newUser: User) {
      this.user = newUser;
    },
    updateSettings(settings: Settings) {
      this.settings = settings;
    },
    updateAnalytics(a: Analytics) {
      this.analytics = a;
    },
    updateWebsite(a: string) {
      this.currentWebsite = a;
      this.ableyk = '58qyVA.CKD0Qg:iOOkt2jKULP5UGOH';
    },
    addnotification(notification: Notification) {
      this.notifications.unshift(notification);
    },
    removenotification(index: number) {
      this.notifications.splice(index, 1);
    },
    clearnotification() {
      this.notifications = [];
    },
  },
});

export default useUserStore;
