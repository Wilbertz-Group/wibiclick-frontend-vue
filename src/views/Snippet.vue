<script setup>
  import Header from "@/components/Header.vue";  
  import { useClipboard } from '@vueuse/core'
  import { useUserStore } from "@/stores/UserStore"
  import { ref } from "vue";

  const source = ref()
  const userStore = useUserStore()
  const { text, copy, copied, isSupported } = useClipboard({ source })

</script>

<template>
  <Header title="Snippet" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            <div class="px-4 sm:px-0">
              <h3 class="text-lg font-medium leading-6 text-gray-900" v-if="userStore.currentWebsite != 'default'">Use this snippet on your website. Place it between the [head] tag</h3>
            </div>
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow sm:rounded-md sm:overflow-hidden">
                  <div class="clipboaard-container" v-if="userStore.currentWebsite != 'default'">
                      <button @click='source= source.innerText; copy()'>
                        <span v-if='!copied'>Copy</span>
                        <span v-else>Copied!</span>
                      </button>

                      <pre v-highlightjs><code ref="source" class="language-javascript hljs">&lt;script&gt; src='https://www.wibi.co.za/wibi.js' data-id='{{ Array.isArray(userStore.currentWebsite) ? userStore.currentWebsite[0] : userStore.currentWebsite }}'> &lt;/script&gt;</code></pre>
                  </div>
                  <h3 class="text-lg font-medium leading-6 text-red-600 m-6 text-center" v-else>You need to select or add a website on the top header to get the snippet!!!</h3>
              </div>
          </div>
        </div>
      </div>

      <div class="hidden sm:block" aria-hidden="true">
        <div class="py-5">
          <div class="border-t border-gray-200" />
        </div>
      </div>

    </div>
  </div>
</template>

<style>
  .code__wrapperTextArea {
    background-color: #182439;
    border: none;
    color: white;
    resize: none;
    overflow: hidden;
    background-color: #20314e;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #304c7c;
}

.clipboaard-container code {
    background: #0e1725;
    color: #fff;
    display: block;
    overflow-x: auto;
    padding: 0.5em;
}

.clipboaard-container pre {
    word-wrap: normal;
    background: 0 0;
    white-space: pre-wrap;
    margin-bottom: 0;
    opacity: 1;
    --tw-text-opacity: 1;
    background-color: rgb(16 23 39);
    color: rgb(120 144 156/1);
    border: none;
    text-align: left;
}


.clipboaard-container button {
    margin-right: 4px;
    float: right;
    margin-top: 5px;
    background-color: rgb(100 132 206);
    transition-duration: .15s;
    transition-property: all;
    transition-timing-function: cubic-bezier(.4,0,.2,1);
    --tw-text-opacity: 1;
    color: rgb(255 255 255/1);
    font-weight: 600;
    font-size: .6rem;
    padding-bottom: 0.4rem;
    padding-top: 0.25rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 9999px;
}

</style>