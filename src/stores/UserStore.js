import { defineStore } from "pinia";
import axios from "axios";
import { useToast } from "vue-toast-notification";

const toast = useToast();

export const useUserStore = defineStore("UserStore", {
  state: () => {
    return {
      user: null,
      events: null,
      newUser: true,
      analytics: {},
      currentWebsite: "default",
      settings: {},
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
