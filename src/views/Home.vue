<script setup>
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/UserStore";
import { onMounted } from "vue";
import Header from "@/components/public/header.vue";
import Footer from "@/components/public/footer.vue";

const userStore = useUserStore();
const router = useRouter();

function isNew(newUser) {
  userStore.isNewUser(!newUser);
}

function toggleMenu(flag) {
  let value = document.getElementById("menu");
  if (flag) {
    value.classList.remove("hidden");
  } else {
    value.classList.add("hidden");
  }
}

userStore.user ? router.push({ name: "dashboard" }) : "";

onMounted(() => {
  var url = 'https://cdn.jsdelivr.net/gh/wmuza/wibiclick/wibi-v3.min.js';
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = url;
  s.onload = function () {
    createWidget("bfb10f7a-d939-49f2-883b-32187705d5ce")
  }

  var x = document.getElementsByTagName('script')[0]
  x.parentNode.insertBefore(s, x);

})
</script>

<template>
  <div class="relative w-full">
    <Header/>
  </div>

  <div class="w-full">
    <div
      class="relative hero-bg mx-auto flex flex-col items-center pt-12 sm:pt-24 pb-24 sm:pb-32 md:pb-48 lg:pb-56 xl:pb-64">
      <svg class="mr-2 lg:mr-12 mt-2 lg:mt-12 absolute right-0 top-0" width="104px" height="95px" viewBox="0 0 104 95"
        version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Work-in-Progress" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.122837612">
          <g transform="translate(-1139.000000, -175.000000)" fill="#FFFFFF">
            <g id="Group-5" transform="translate(1139.000000, 175.000000)">
              <path
                d="M1.99948119,4 C0.897535668,4 0,3.10246433 0,1.99948119 C0,0.896498054 0.897535668,0 1.99948119,0 C3.10350195,0 4,0.896498054 4,1.99948119 C4,3.10246433 3.10350195,4 1.99948119,4"
                id="Fill-46"></path>
              <path
                d="M22,4 C20.8973029,4 20,3.10246433 20,1.99948119 C20,0.896498054 20.8973029,0 22,0 C23.1037344,0 24,0.896498054 24,1.99948119 C24,3.10246433 23.1037344,4 22,4"
                id="Fill-47"></path>
              <path
                d="M42,4 C40.8962656,4 40,3.10246433 40,1.99948119 C40,0.896498054 40.8962656,0 42,0 C43.1016598,0 44,0.896498054 44,1.99948119 C44,3.10246433 43.1016598,4 42,4"
                id="Fill-48"></path>
              <path
                d="M62.0005188,4 C60.8964981,4 60,3.10246433 60,1.99948119 C60,0.896498054 60.8964981,0 62.0005188,0 C63.1024643,0 64,0.896498054 64,1.99948119 C64,3.10246433 63.1024643,4 62.0005188,4"
                id="Fill-49"></path>
              <path
                d="M81.9984436,4 C80.8964981,4 80,3.10246433 80,1.99948119 C80,0.896498054 80.8964981,0 81.9984436,0 C83.1024643,0 84,0.896498054 84,1.99948119 C84,3.10246433 83.1024643,4 81.9984436,4"
                id="Fill-50"></path>
              <path
                d="M102,4 C100.89834,4 100,3.10246433 100,1.99948119 C100,0.896498054 100.89834,0 102,0 C103.103734,0 104,0.896498054 104,1.99948119 C104,3.10246433 103.103734,4 102,4"
                id="Fill-51"></path>
              <path
                d="M1.99948119,22 C0.897535668,22 0,21.1024643 0,19.9994812 C0,18.8964981 0.897535668,18 1.99948119,18 C3.10350195,18 4,18.8964981 4,19.9994812 C4,21.1024643 3.10350195,22 1.99948119,22"
                id="Fill-52"></path>
              <path
                d="M22,22 C20.8973029,22 20,21.1024643 20,19.9994812 C20,18.8964981 20.8973029,18 22,18 C23.1037344,18 24,18.8964981 24,19.9994812 C24,21.1024643 23.1037344,22 22,22"
                id="Fill-53"></path>
              <path
                d="M42,22 C40.8962656,22 40,21.1024643 40,19.9994812 C40,18.8964981 40.8962656,18 42,18 C43.1016598,18 44,18.8964981 44,19.9994812 C44,21.1024643 43.1016598,22 42,22"
                id="Fill-54"></path>
              <path
                d="M62.0005188,22 C60.8964981,22 60,21.1024643 60,19.9994812 C60,18.8964981 60.8964981,18 62.0005188,18 C63.1024643,18 64,18.8964981 64,19.9994812 C64,21.1024643 63.1024643,22 62.0005188,22"
                id="Fill-55"></path>
              <path
                d="M81.9984436,22 C80.8964981,22 80,21.1024643 80,19.9994812 C80,18.8964981 80.8964981,18 81.9984436,18 C83.1024643,18 84,18.8964981 84,19.9994812 C84,21.1024643 83.1024643,22 81.9984436,22"
                id="Fill-56"></path>
              <path
                d="M102,22 C100.89834,22 100,21.1024643 100,19.9994812 C100,18.8964981 100.89834,18 102,18 C103.103734,18 104,18.8964981 104,19.9994812 C104,21.1024643 103.103734,22 102,22"
                id="Fill-57"></path>
              <path
                d="M1.99948119,40 C0.897535668,40 0,39.1026971 0,38 C0,36.8973029 0.897535668,36 1.99948119,36 C3.10350195,36 4,36.8973029 4,38 C4,39.1026971 3.10350195,40 1.99948119,40"
                id="Fill-58"></path>
              <path
                d="M22,40 C20.8973029,40 20,39.1026971 20,38 C20,36.8973029 20.8973029,36 22,36 C23.1037344,36 24,36.8973029 24,38 C24,39.1026971 23.1037344,40 22,40"
                id="Fill-59"></path>
              <path
                d="M42,40 C40.8962656,40 40,39.1026971 40,38 C40,36.8973029 40.8962656,36 42,36 C43.1016598,36 44,36.8973029 44,38 C44,39.1026971 43.1016598,40 42,40"
                id="Fill-60"></path>
              <path
                d="M62.0005188,40 C60.8964981,40 60,39.1026971 60,38 C60,36.8973029 60.8964981,36 62.0005188,36 C63.1024643,36 64,36.8973029 64,38 C64,39.1026971 63.1024643,40 62.0005188,40"
                id="Fill-61"></path>
              <path
                d="M81.9984436,40 C80.8964981,40 80,39.1026971 80,38 C80,36.8973029 80.8964981,36 81.9984436,36 C83.1024643,36 84,36.8973029 84,38 C84,39.1026971 83.1024643,40 81.9984436,40"
                id="Fill-62"></path>
              <path
                d="M102,40 C100.89834,40 100,39.1026971 100,38 C100,36.8973029 100.89834,36 102,36 C103.103734,36 104,36.8973029 104,38 C104,39.1026971 103.103734,40 102,40"
                id="Fill-63"></path>
              <path
                d="M1.99948119,59 C0.897535668,59 0,58.1026971 0,57 C0,55.8973029 0.897535668,55 1.99948119,55 C3.10350195,55 4,55.8973029 4,57 C4,58.1026971 3.10350195,59 1.99948119,59"
                id="Fill-64"></path>
              <path
                d="M22,59 C20.8973029,59 20,58.1026971 20,57 C20,55.8973029 20.8973029,55 22,55 C23.1037344,55 24,55.8973029 24,57 C24,58.1026971 23.1037344,59 22,59"
                id="Fill-65"></path>
              <path
                d="M42,59 C40.8962656,59 40,58.1026971 40,57 C40,55.8973029 40.8962656,55 42,55 C43.1016598,55 44,55.8973029 44,57 C44,58.1026971 43.1016598,59 42,59"
                id="Fill-66"></path>
              <path
                d="M62.0005188,59 C60.8964981,59 60,58.1026971 60,57 C60,55.8973029 60.8964981,55 62.0005188,55 C63.1024643,55 64,55.8973029 64,57 C64,58.1026971 63.1024643,59 62.0005188,59"
                id="Fill-67"></path>
              <path
                d="M81.9984436,59 C80.8964981,59 80,58.1026971 80,57 C80,55.8973029 80.8964981,55 81.9984436,55 C83.1024643,55 84,55.8973029 84,57 C84,58.1026971 83.1024643,59 81.9984436,59"
                id="Fill-68"></path>
              <path
                d="M102,59 C100.89834,59 100,58.1026971 100,57 C100,55.8973029 100.89834,55 102,55 C103.103734,55 104,55.8973029 104,57 C104,58.1026971 103.103734,59 102,59"
                id="Fill-69"></path>
              <path
                d="M1.99948119,77 C0.897535668,77 0,76.1026971 0,75 C0,73.8973029 0.897535668,73 1.99948119,73 C3.10350195,73 4,73.8973029 4,75 C4,76.1026971 3.10350195,77 1.99948119,77"
                id="Fill-70"></path>
              <path
                d="M22,77 C20.8973029,77 20,76.1026971 20,75 C20,73.8973029 20.8973029,73 22,73 C23.1037344,73 24,73.8973029 24,75 C24,76.1026971 23.1037344,77 22,77"
                id="Fill-71"></path>
              <path
                d="M42,77 C40.8962656,77 40,76.1026971 40,75 C40,73.8973029 40.8962656,73 42,73 C43.1016598,73 44,73.8973029 44,75 C44,76.1026971 43.1016598,77 42,77"
                id="Fill-72"></path>
              <path
                d="M62.0005188,77 C60.8964981,77 60,76.1026971 60,75 C60,73.8973029 60.8964981,73 62.0005188,73 C63.1024643,73 64,73.8973029 64,75 C64,76.1026971 63.1024643,77 62.0005188,77"
                id="Fill-73"></path>
              <path
                d="M81.9984436,77 C80.8964981,77 80,76.1026971 80,75 C80,73.8973029 80.8964981,73 81.9984436,73 C83.1024643,73 84,73.8973029 84,75 C84,76.1026971 83.1024643,77 81.9984436,77"
                id="Fill-74"></path>
              <path
                d="M102,77 C100.89834,77 100,76.1026971 100,75 C100,73.8973029 100.89834,73 102,73 C103.103734,73 104,73.8973029 104,75 C104,76.1026971 103.103734,77 102,77"
                id="Fill-75"></path>
              <path
                d="M1.99948119,95 C0.897535668,95 0,94.1024643 0,92.9994812 C0,91.8964981 0.897535668,91 1.99948119,91 C3.10350195,91 4,91.8964981 4,92.9994812 C4,94.1024643 3.10350195,95 1.99948119,95"
                id="Fill-76"></path>
              <path
                d="M22,95 C20.8973029,95 20,94.1024643 20,92.9994812 C20,91.8964981 20.8973029,91 22,91 C23.1037344,91 24,91.8964981 24,92.9994812 C24,94.1024643 23.1037344,95 22,95"
                id="Fill-77"></path>
              <path
                d="M42,95 C40.8962656,95 40,94.1024643 40,92.9994812 C40,91.8964981 40.8962656,91 42,91 C43.1016598,91 44,91.8964981 44,92.9994812 C44,94.1024643 43.1016598,95 42,95"
                id="Fill-78"></path>
              <path
                d="M62.0005188,95 C60.8964981,95 60,94.1024643 60,92.9994812 C60,91.8964981 60.8964981,91 62.0005188,91 C63.1024643,91 64,91.8964981 64,92.9994812 C64,94.1024643 63.1024643,95 62.0005188,95"
                id="Fill-79"></path>
              <path
                d="M81.9984436,95 C80.8964981,95 80,94.1024643 80,92.9994812 C80,91.8964981 80.8964981,91 81.9984436,91 C83.1024643,91 84,91.8964981 84,92.9994812 C84,94.1024643 83.1024643,95 81.9984436,95"
                id="Fill-80"></path>
              <path
                d="M102,95 C100.89834,95 100,94.1024643 100,92.9994812 C100,91.8964981 100.89834,91 102,91 C103.103734,91 104,91.8964981 104,92.9994812 C104,94.1024643 103.103734,95 102,95"
                id="Fill-81"></path>
              <polyline id="Fill-82" points="75 87 13 26 75 26 75 87"></polyline>
            </g>
          </g>
        </g>
      </svg>
      <svg class="ml-2 lg:ml-12 mb-2 lg:mb-12 absolute bottom-0 left-0" width="104px" height="95px" viewBox="0 0 104 95"
        version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Work-in-Progress" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" opacity="0.122837612">
          <g transform="translate(-206.000000, -596.000000)" fill="#FFFFFF">
            <g id="Group-5"
              transform="translate(258.000000, 643.500000) scale(-1, -1) translate(-258.000000, -643.500000) translate(206.000000, 596.000000)">
              <path
                d="M1.99948119,4 C0.897535668,4 0,3.10246433 0,1.99948119 C0,0.896498054 0.897535668,0 1.99948119,0 C3.10350195,0 4,0.896498054 4,1.99948119 C4,3.10246433 3.10350195,4 1.99948119,4"
                id="Fill-46"></path>
              <path
                d="M22,4 C20.8973029,4 20,3.10246433 20,1.99948119 C20,0.896498054 20.8973029,0 22,0 C23.1037344,0 24,0.896498054 24,1.99948119 C24,3.10246433 23.1037344,4 22,4"
                id="Fill-47"></path>
              <path
                d="M42,4 C40.8962656,4 40,3.10246433 40,1.99948119 C40,0.896498054 40.8962656,0 42,0 C43.1016598,0 44,0.896498054 44,1.99948119 C44,3.10246433 43.1016598,4 42,4"
                id="Fill-48"></path>
              <path
                d="M62.0005188,4 C60.8964981,4 60,3.10246433 60,1.99948119 C60,0.896498054 60.8964981,0 62.0005188,0 C63.1024643,0 64,0.896498054 64,1.99948119 C64,3.10246433 63.1024643,4 62.0005188,4"
                id="Fill-49"></path>
              <path
                d="M81.9984436,4 C80.8964981,4 80,3.10246433 80,1.99948119 C80,0.896498054 80.8964981,0 81.9984436,0 C83.1024643,0 84,0.896498054 84,1.99948119 C84,3.10246433 83.1024643,4 81.9984436,4"
                id="Fill-50"></path>
              <path
                d="M102,4 C100.89834,4 100,3.10246433 100,1.99948119 C100,0.896498054 100.89834,0 102,0 C103.103734,0 104,0.896498054 104,1.99948119 C104,3.10246433 103.103734,4 102,4"
                id="Fill-51"></path>
              <path
                d="M1.99948119,22 C0.897535668,22 0,21.1024643 0,19.9994812 C0,18.8964981 0.897535668,18 1.99948119,18 C3.10350195,18 4,18.8964981 4,19.9994812 C4,21.1024643 3.10350195,22 1.99948119,22"
                id="Fill-52"></path>
              <path
                d="M22,22 C20.8973029,22 20,21.1024643 20,19.9994812 C20,18.8964981 20.8973029,18 22,18 C23.1037344,18 24,18.8964981 24,19.9994812 C24,21.1024643 23.1037344,22 22,22"
                id="Fill-53"></path>
              <path
                d="M42,22 C40.8962656,22 40,21.1024643 40,19.9994812 C40,18.8964981 40.8962656,18 42,18 C43.1016598,18 44,18.8964981 44,19.9994812 C44,21.1024643 43.1016598,22 42,22"
                id="Fill-54"></path>
              <path
                d="M62.0005188,22 C60.8964981,22 60,21.1024643 60,19.9994812 C60,18.8964981 60.8964981,18 62.0005188,18 C63.1024643,18 64,18.8964981 64,19.9994812 C64,21.1024643 63.1024643,22 62.0005188,22"
                id="Fill-55"></path>
              <path
                d="M81.9984436,22 C80.8964981,22 80,21.1024643 80,19.9994812 C80,18.8964981 80.8964981,18 81.9984436,18 C83.1024643,18 84,18.8964981 84,19.9994812 C84,21.1024643 83.1024643,22 81.9984436,22"
                id="Fill-56"></path>
              <path
                d="M102,22 C100.89834,22 100,21.1024643 100,19.9994812 C100,18.8964981 100.89834,18 102,18 C103.103734,18 104,18.8964981 104,19.9994812 C104,21.1024643 103.103734,22 102,22"
                id="Fill-57"></path>
              <path
                d="M1.99948119,40 C0.897535668,40 0,39.1026971 0,38 C0,36.8973029 0.897535668,36 1.99948119,36 C3.10350195,36 4,36.8973029 4,38 C4,39.1026971 3.10350195,40 1.99948119,40"
                id="Fill-58"></path>
              <path
                d="M22,40 C20.8973029,40 20,39.1026971 20,38 C20,36.8973029 20.8973029,36 22,36 C23.1037344,36 24,36.8973029 24,38 C24,39.1026971 23.1037344,40 22,40"
                id="Fill-59"></path>
              <path
                d="M42,40 C40.8962656,40 40,39.1026971 40,38 C40,36.8973029 40.8962656,36 42,36 C43.1016598,36 44,36.8973029 44,38 C44,39.1026971 43.1016598,40 42,40"
                id="Fill-60"></path>
              <path
                d="M62.0005188,40 C60.8964981,40 60,39.1026971 60,38 C60,36.8973029 60.8964981,36 62.0005188,36 C63.1024643,36 64,36.8973029 64,38 C64,39.1026971 63.1024643,40 62.0005188,40"
                id="Fill-61"></path>
              <path
                d="M81.9984436,40 C80.8964981,40 80,39.1026971 80,38 C80,36.8973029 80.8964981,36 81.9984436,36 C83.1024643,36 84,36.8973029 84,38 C84,39.1026971 83.1024643,40 81.9984436,40"
                id="Fill-62"></path>
              <path
                d="M102,40 C100.89834,40 100,39.1026971 100,38 C100,36.8973029 100.89834,36 102,36 C103.103734,36 104,36.8973029 104,38 C104,39.1026971 103.103734,40 102,40"
                id="Fill-63"></path>
              <path
                d="M1.99948119,59 C0.897535668,59 0,58.1026971 0,57 C0,55.8973029 0.897535668,55 1.99948119,55 C3.10350195,55 4,55.8973029 4,57 C4,58.1026971 3.10350195,59 1.99948119,59"
                id="Fill-64"></path>
              <path
                d="M22,59 C20.8973029,59 20,58.1026971 20,57 C20,55.8973029 20.8973029,55 22,55 C23.1037344,55 24,55.8973029 24,57 C24,58.1026971 23.1037344,59 22,59"
                id="Fill-65"></path>
              <path
                d="M42,59 C40.8962656,59 40,58.1026971 40,57 C40,55.8973029 40.8962656,55 42,55 C43.1016598,55 44,55.8973029 44,57 C44,58.1026971 43.1016598,59 42,59"
                id="Fill-66"></path>
              <path
                d="M62.0005188,59 C60.8964981,59 60,58.1026971 60,57 C60,55.8973029 60.8964981,55 62.0005188,55 C63.1024643,55 64,55.8973029 64,57 C64,58.1026971 63.1024643,59 62.0005188,59"
                id="Fill-67"></path>
              <path
                d="M81.9984436,59 C80.8964981,59 80,58.1026971 80,57 C80,55.8973029 80.8964981,55 81.9984436,55 C83.1024643,55 84,55.8973029 84,57 C84,58.1026971 83.1024643,59 81.9984436,59"
                id="Fill-68"></path>
              <path
                d="M102,59 C100.89834,59 100,58.1026971 100,57 C100,55.8973029 100.89834,55 102,55 C103.103734,55 104,55.8973029 104,57 C104,58.1026971 103.103734,59 102,59"
                id="Fill-69"></path>
              <path
                d="M1.99948119,77 C0.897535668,77 0,76.1026971 0,75 C0,73.8973029 0.897535668,73 1.99948119,73 C3.10350195,73 4,73.8973029 4,75 C4,76.1026971 3.10350195,77 1.99948119,77"
                id="Fill-70"></path>
              <path
                d="M22,77 C20.8973029,77 20,76.1026971 20,75 C20,73.8973029 20.8973029,73 22,73 C23.1037344,73 24,73.8973029 24,75 C24,76.1026971 23.1037344,77 22,77"
                id="Fill-71"></path>
              <path
                d="M42,77 C40.8962656,77 40,76.1026971 40,75 C40,73.8973029 40.8962656,73 42,73 C43.1016598,73 44,73.8973029 44,75 C44,76.1026971 43.1016598,77 42,77"
                id="Fill-72"></path>
              <path
                d="M62.0005188,77 C60.8964981,77 60,76.1026971 60,75 C60,73.8973029 60.8964981,73 62.0005188,73 C63.1024643,73 64,73.8973029 64,75 C64,76.1026971 63.1024643,77 62.0005188,77"
                id="Fill-73"></path>
              <path
                d="M81.9984436,77 C80.8964981,77 80,76.1026971 80,75 C80,73.8973029 80.8964981,73 81.9984436,73 C83.1024643,73 84,73.8973029 84,75 C84,76.1026971 83.1024643,77 81.9984436,77"
                id="Fill-74"></path>
              <path
                d="M102,77 C100.89834,77 100,76.1026971 100,75 C100,73.8973029 100.89834,73 102,73 C103.103734,73 104,73.8973029 104,75 C104,76.1026971 103.103734,77 102,77"
                id="Fill-75"></path>
              <path
                d="M1.99948119,95 C0.897535668,95 0,94.1024643 0,92.9994812 C0,91.8964981 0.897535668,91 1.99948119,91 C3.10350195,91 4,91.8964981 4,92.9994812 C4,94.1024643 3.10350195,95 1.99948119,95"
                id="Fill-76"></path>
              <path
                d="M22,95 C20.8973029,95 20,94.1024643 20,92.9994812 C20,91.8964981 20.8973029,91 22,91 C23.1037344,91 24,91.8964981 24,92.9994812 C24,94.1024643 23.1037344,95 22,95"
                id="Fill-77"></path>
              <path
                d="M42,95 C40.8962656,95 40,94.1024643 40,92.9994812 C40,91.8964981 40.8962656,91 42,91 C43.1016598,91 44,91.8964981 44,92.9994812 C44,94.1024643 43.1016598,95 42,95"
                id="Fill-78"></path>
              <path
                d="M62.0005188,95 C60.8964981,95 60,94.1024643 60,92.9994812 C60,91.8964981 60.8964981,91 62.0005188,91 C63.1024643,91 64,91.8964981 64,92.9994812 C64,94.1024643 63.1024643,95 62.0005188,95"
                id="Fill-79"></path>
              <path
                d="M81.9984436,95 C80.8964981,95 80,94.1024643 80,92.9994812 C80,91.8964981 80.8964981,91 81.9984436,91 C83.1024643,91 84,91.8964981 84,92.9994812 C84,94.1024643 83.1024643,95 81.9984436,95"
                id="Fill-80"></path>
              <path
                d="M102,95 C100.89834,95 100,94.1024643 100,92.9994812 C100,91.8964981 100.89834,91 102,91 C103.103734,91 104,91.8964981 104,92.9994812 C104,94.1024643 103.103734,95 102,95"
                id="Fill-81"></path>
              <polyline id="Fill-82" points="75 87 13 26 75 26 75 87"></polyline>
            </g>
          </g>
        </g>
      </svg>
      <div class="w-11/12 sm:w-2/3 mb-5 sm:mb-10">
        <h1
          class="pt-24 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-center text-white font-bold leading-tight">
          An easy way for a website visitor to contact you
        </h1>
        <h3 class="pt-5 text-lg md:text-lg text-center text-white leading-tight">Increase inbound leads for your
          business, help visitors connect with you with a single tap. <br>Get started for free. No credit card needed.</h3>
      </div>
      <div class="flex justify-center items-center mb-10 sm:mb-20">
        <a href="./authenticate"
          class="hover:text-white hover:bg-transparent hover:border-white border bg-white transition duration-150 ease-in-out focus:outline-none rounded font-semibold text-black px-4 sm:px-8 py-1 sm:py-3 text-sm"
          @click="isNew(true)">
          Try free with 1000 credits
        </a>
        <router-link to="authenticate"
          class="hover:bg-white hover:text-sky-400 hover:border-indigo-600 ml-3 sm:ml-6 bg-transparent transition duration-150 ease-in-out focus:outline-none hover:bg-indigo-700-800 rounded border border-white text-white px-4 sm:px-8 py-1 sm:py-3 text-sm"
          @click="isNew(false)">
          Login
        </router-link>
      </div>
    </div>
    <div class="container mx-auto flex justify-center md:-mt-56 -mt-20 sm:-mt-40">
      <div class="relative sm:w-2/3 w-11/12">
        <img src="@/assets/images/settings.png" alt="" class="absolute" />
      </div>
    </div>
  </div>

  <div class="bg-gradient-to-b from-sky-50 to-sky-200 h-fit pt-96">
    <div class="container m-auto px-6 py-20 md:px-12 lg:px-20">
      <div class="m-auto text-center pt-40 lg:w-8/12 xl:w-7/12">
        <h2 id="pricing" class="text-4xl text-sky-900 font-bold md:text-5xl">Pricing</h2>
      </div>
      <div class="mt-12 m-auto items-center justify-center space-y-6 lg:flex lg:space-y-0 lg:space-x-6 xl:w-10/12">
        <div class="relative z-10 group mx-auto sm:w-7/12 lg:w-5/12">
          <div class="m-auto bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700">

            <h3 class="text-3xl text-gray-700 font-semibold text-center">Professional Plan</h3>
            <div class="relative flex justify-around max-w-md m-auto">
              <div class="flex">
                <span class="-ml-6 mt-2 text-3xl text-cyan-500 font-bold">R0.1
                  <span class="text-xl">/ credit</span>
                </span>
              </div>

            </div>
            <ul role="list" class="w-max space-y-4 pb-6 pt-4 m-auto text-gray-600">
              <li class="space-x-2">
                <span class="text-cyan-500 font-semibold">&check;</span>
                <span>Unlimited websites</span>
              </li>
              <li class="space-x-2">
                <span class="text-cyan-500 font-semibold">&check;</span>
                <span>1 credit per page View</span>
              </li>
              <li class="space-x-2">
                <span class="text-cyan-500 font-semibold">&check;</span>
                <span>1 credit per page Click</span>
              </li>
              <li class="space-x-2">
                <span class="text-cyan-500 font-semibold">&check;</span>
                <span>Integration help</span>
              </li>
              <li class="space-x-2">
                <span class="text-cyan-500 font-semibold">&check;</span>
                <span>Prioritized email support</span>
              </li>
            </ul>

            <a href="./authenticate" @click="isNew(true)"
              class="text-white bg-gray-800 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center ">
              Start plan (1000 credits free)</a>
              <span class="text-xs px-5 py-2.5 inline-flex justify-center w-full text-center ">Our billing is in South African Rand**</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="services" class="py-16 bg-white">
    <div class="container m-auto px-6 text-gray-600 md:px-12 xl:px-6">
      <div class="space-y-6 md:space-y-0 md:flex md:gap-6 lg:items-center lg:gap-12">
        <div class="md:5/12 lg:w-5/12">
          <img src="@/assets/images/startup.png" alt="image" loading="lazy" width="" height="">
        </div>
        <div class="md:7/12 lg:w-6/12">
          <h2 class="text-2xl text-gray-900 font-bold md:text-4xl">Help website visitors to contact you immediately and
            without effort.</h2>
          <p class="mt-6 text-gray-600">Do you lose customers just because they were not able to understand whether you
            are the right fit for them via a website?</p>
          <p class="mt-4 text-gray-600">Most successful business begins with a conversation, hence making it easy to
            contact gives them the opportunity to reach out on channels they already use.</p>
          <p class="mt-4 text-gray-600">This also helps in increasing trust, open rate & conversation rate when you
            reach out.</p>
        </div>
      </div>
    </div>
  </div>


  <div class="relative py-20 flex flex-col items-center bg-cyan-900 overflow-hidden md:py-40">
    <div class="relative z-[1] container m-auto px-6 md:px-12">
      <div class="m-auto text-center md:w-8/12 lg:w-6/12">
        <h2 class="text-2xl text-white font-bold md:text-4xl">Convert visitor to <span
            class="text-sky-400">customers</span> increase inbound leads for your business.</h2>
      </div>
    </div>
    <div aria-hidden="true" class="absolute h-full inset-0 flex items-center">
      <div aria-hidden="true"
        class="bg-layers bg-scale w-56 h-56 m-auto blur-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full md:w-[30rem] md:h-[30rem] md:blur-3xl">
      </div>
    </div>
    <div aria-hidden="true" class="absolute inset-0 w-full h-full bg-[#020314] opacity-90"></div>
  </div>

  
<div class="py-16 bg-gray-50">  
  <div class="container m-auto text-gray-600 md:px-12 xl:px-6">
      <div class="mb-12 space-y-4 px-6 md:px-0">
        <h2 class="text-center text-2xl text-gray-900 font-bold md:text-4xl">Testimonials</h2>
        <p class="text-center">We don't like to brag, but we don't mind letting our customers do it for us. <br>
          Here are a few nice things folks have said about Wibi Click over the years.</p>
      </div>
      
      <div class="swiper mySwiper">
          <div class="swiper-wrapper pb-8">
            <div class="swiper-slide !bg-transparent px-6 md:px-0">
              <div class="rounded-xl bg-white shadow-xl md:mx-auto lg:w-9/12 xl:w-7/12">
                <div class="grid md:grid-cols-2">
                  <img src="@/assets/images/card.webp" class="rounded-t-xl h-full w-full object-cover md:rounded-l-xl md:rounded-tr-none" alt="image" width="640" height="422" loading="lazy">
                  <div class="mx-auto space-y-6 p-6 text-center sm:p-8">
                      <div class="w-24 mx-auto">
                        <img src="@/assets/images/client-4.png" alt="company logo" height="400" width="142" loading="lazy">
                      </div>
                      <p class="text-gray-600"> <span class="font-serif">"</span> I had it set up on my main website in a few minutes. Within a few hours started to received leads. Well worth the investment and a great contact widget. <span class="font-serif">"</span></p>
                      <h6 class="text-lg font-semibold leading-none">Works Perfectly</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>      
      </div>
  </div>
</div>
                            
<Footer/>
</template>

<style>
.hero-bg {
  background-color: #101d2d;
}

.bg-layers {
  -webkit-animation: filter-animation 4s infinite;
  animation: filter-animation 4s infinite;
}

.bg-scale {
  -webkit-animation: filter-animation 8s infinite;
  animation: filter-scale 8s infinite;
}

@-webkit-keyframes filter-animation {
  0% {
    -webkit-filter: hue-rotate(0deg);
  }

  50% {
    -webkit-filter: hue-rotate(45deg);
  }

  100% {
    -webkit-filter: hue-rotate(0deg);
  }
}

@keyframes filter-animation {
  0% {
    filter: hue-rotate(0deg);
  }

  50% {
    filter: hue-rotate(45deg);
  }

  100% {
    filter: hue-rotate(0deg);
  }
}

@keyframes filter-scale {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.4);
  }

  100% {
    transform: scale(.8);
  }
}
</style>