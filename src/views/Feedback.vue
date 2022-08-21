<script setup>
  import Header from "@/components/Header.vue";  
  import HubspotForm from '@jagaad/vue-hubspot-form';
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref } from "vue";

  const userStore = useUserStore()

  onMounted(()=>{
    const script = document.createElement("script");
    script.src="https://js.hsforms.net/forms/v2.js";
    document.body.appendChild(script);
    script.addEventListener("load", () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          region: "eu1",
          portalId: "26174105",
          formId: "8c5864e5-b30f-48ad-b10e-7cee4f663c81",
          target: "#hubspotForm"
        })
      }
    })

  })

</script>

<template>
  <Header title="Snippet" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <div id="hubspotForm" v-once></div>
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
