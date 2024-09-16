import { defineStore } from "pinia";
import axios from "axios";
import { useToast } from "vue-toast-notification";

const toast = useToast();

export const useUserStore = defineStore("UserStore", {
  state: () => {
    return {
      user: null,
      rtlClass: 'ltr',
      ableyk: '58qyVA.oZmMMA:EFhE0xzGmbBhHdWDNYcu-qD2UjuKNYj2wcotHQo1FiY',
      events: '',
      newUser: true,
      analytics: {},
      notifications: [],
      currentWebsite: "default",
      settings: {},
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
    };
  },
  getters: {
    //lastName: (state) => state.user.split(' ')[1]
  },
  actions: {
    async register(credentials) {
      try {
        const response = await axios.post("register", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        this.user = response.data;
        toast.success("You are successfully Registered");
      } catch (error) {
        toast.error(error.message);
      }
    },
    async verifyEmail(credentials){
      try {
        await axios.post("verify-email", credentials);
      } catch (error) {
        toast.error(error.message);
      }
    },
    async forgotPassword(credentials){
      try {
        await axios.post("password-reset", credentials);
      } catch (error) {
        toast.error(error.message);
      }
    },
    async login(credentials) {
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
      } catch (error) {
        toast.error(
          error.message.includes("status code 401")
            ? "Invalid login details"
            : error.message
        );
      }
    },
    async updateLogin(credentials) {
      try {
        const response = await axios.post("update-login", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
        this.user = response.data;
      } catch (error) {
        toast.error(error?.message);
      }
    },
    async updateProfile(credentials) {
      try {
        const response = await axios.post("profile", credentials);
        localStorage.setItem("user", JSON.stringify(response.data));
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${response.data.token}`;
        this.user = response.data;
      } catch (error) {
        toast.error(error?.message);
      }
    },
    async addWebsite(credentials) {
      try {
        const response = await axios.post("add-website", credentials);
      } catch (error) {
        toast.error(error?.message);
      }
    },
    setWebsites(websites) {
      this.websites = websites;
    },
    isNewUser(newUser) {
      this.newUser = newUser;
    },
    updateUser(newUser) {
      this.user = newUser;
    },
    updateSettings(settings) {
      this.settings = settings;
    },
    updateAnalytics(a) {
      this.analytics = a;
    },
    updateWebsite(a) {
      this.currentWebsite = a;
      this.ableyk = '58qyVA.CKD0Qg:iOOkt2jKULP5UGOH';
    },
    addnotification(notification) {
      this.notifications.unshift(notification);
    },
    removenotification(index) {
      this.notifications.splice(index, 1);
    },
		clearnotification() {
      this.notifications = [];
    },
  },
  persist: {
    afterRestore: (context) => {
      if (context.store?.user) {
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${context.store.user.token}`;
      }
    },
  },
});
