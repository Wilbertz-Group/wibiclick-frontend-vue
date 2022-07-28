import { defineStore } from "pinia";
import axios from "axios";
import { useToast } from 'vue-toast-notification';

const toast = useToast();

export const useUserStore = defineStore('UserStore', {
	state: () => {
		return {
			user: null,
			events: null,
			newUser: true,
			analytics: {},
			currentWebsite: ''
		}
	},
	getters: {
		//lastName: (state) => state.user.split(' ')[1]
	},
	actions: {
		async register (credentials) { 
			try {
				const response = await axios.post('https://wibi.wilbertzgroup.com/register', credentials);
				localStorage.setItem('user', JSON.stringify(response.data))
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
				this.user = response.data
				toast.success("You have successfully registered and automatically logged in..")
			} catch (error) {
				toast.error(error.response.data.message)				
			} 
    },
    async login (credentials) {
			try {
				const response = await axios.post('https://wibi.wilbertzgroup.com/login', credentials);
				localStorage.setItem('user', JSON.stringify(response.data))
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
				this.user = response.data
				toast.success("You are successfully logged in")
			} catch (error) {
				toast.error(error.response.data.message)
			}
    },
		async updateLogin (credentials) {
			try {
				const response = await axios.post('https://wibi.wilbertzgroup.com/update-login', credentials);
				localStorage.setItem('user', JSON.stringify(response.data))
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
				this.user = response.data				
			} catch (error) {
				toast.error(error.response.data.message)
			}
    },
		async updateProfile (credentials) {
			try {
				const response = await axios.post('https://wibi.wilbertzgroup.com/profile', credentials);
				localStorage.setItem('user', JSON.stringify(response.data))
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
				this.user = response.data
			} catch (error) {
				toast.error(error.response.data.message)
			}
    },
		async addWebsite (credentials) {
			try {
				const response = await axios.post('https://wibi.wilbertzgroup.com/add-website', credentials);
			} catch (error) {
				toast.error(error.response.data.message)
			}
    },
    isNewUser(newUser) {
      this.newUser = newUser
    },
		updateUser(newUser) {
      this.user = newUser
    },
		updateAnalytics(a) {
      this.analytics = a
    },
		selectedWebsite(a) {
      this.currentWebsite = a
    },
	},
	persist: {
    afterRestore: context => {
			if(context.store?.user){
				axios.defaults.headers.common['Authorization'] = `Bearer ${context.store.user.token}`
			}
    },
  },
})