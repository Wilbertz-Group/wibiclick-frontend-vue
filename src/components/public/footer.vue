<script setup>
	import { useUserStore } from "@/stores/UserStore";

	const userStore = useUserStore();
	
	function isNew(newUser) {
		userStore.isNewUser(!newUser);
	}
</script>


<template>
  <footer>
    <div class="pt-8 bg-gradient-to-b from-gray-900 to-sky-900 md:pt-20">
        <div class="container m-auto px-6 space-y-8 text-gray-400 md:px-12 lg:px-20">
            <div>
                <div class="mb-6 gap-6 items-center justify-between py-6 sm:flex md:mb-16 md:py-0 md:space-y-6">
                    <a href="#" aria-label="logo" class="flex space-x-2 items-center">
                      <div aria-hidden="true" class="flex space-x-1">
                        <div class="h-6 w-2 bg-sky-500"></div>
                      </div>
                      <span class="text-base font-bold text-white">Wibi Click</span>
                    </a>
                    <div class="flex flex-wrap flex-col-reverse gap-6 mt-6 sm:flex-row sm:mt-0 sm:items-center">
                        <select name="langage" id="langae" class="px-4 py-2 w-full rounded-xl bg-gray-900 sm:w-max">
                            <option value="en">English</option>
                        </select>
                        <div class="flex gap-6">
                            <a href="#" target="blank" aria-label="twitter" class="hover:text-cyan-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-twitter" viewBox="0 0 16 16">
<path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="pb-16 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                        <div>
                            <h6 class="text-lg font-medium text-white">Navigation</h6>
                            <ul class="list-inside mt-4 space-y-4">
                                <li>
                                    <a href="/" class="hover:text-cyan-400 transition">Home</a>
                                </li>
                                <li>
                                    <a href="./#pricing" class="hover:text-cyan-400 transition">Pricing</a>
                                </li>
                                <li>
                                    <a href="./#services" class="hover:text-cyan-400 transition">Services</a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h6 class="text-lg font-medium text-white">Legal</h6>
                            <ul class="list-inside mt-4 space-y-4">
                                <li>
                                    <router-link :to="{name: 'terms'}" class="hover:text-cyan-400 transition">Terms and Conditions </router-link>
                                </li>
                                <li>
                                    <router-link :to="{name: 'privacy'}" class="hover:text-cyan-400 transition">Privacy Policy</router-link>
                                </li>
                                <li>
                                    <router-link :to="{name: 'home'}" class="hover:text-cyan-400 transition">FAQ</router-link>
                                </li>
                            </ul>
                        </div>
                        <div class="col-span-2 sm:col-span-3 md:col-span-2">
                            <h6 class="text-lg font-medium text-white">Contact</h6>
                            <ul class="list-inside mt-4 space-y-4">
                                <li>
                                    <a href="mailto:meschacirung@gmail.com" class="hover:text-cyan-400 transition">info@wibi.co.za</a>
                                </li>
                                <li>
                                  <a href="./authenticate" @click="isNew(false)" class="hover:text-cyan-400 transition">Login</a>
                                </li>
                                <li>
                                  <a href="./authenticate" @click="isNew(true)" class="hover:text-cyan-400 transition">Sign up</a>
                                </li>                                
                                <li>
                                    <div>
                                      Increase sales, engage visitors, collect leads and more. Save your time and money with ready-to-use solutions and grow your business faster! ⚡️
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="py-8 border-t border-cyan-800 text-gray-200 flex justify-between">
                        <span>&copy; Wibi Click - <span id="year">2022</span></span>
                        <span>All right reserved</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
</template>