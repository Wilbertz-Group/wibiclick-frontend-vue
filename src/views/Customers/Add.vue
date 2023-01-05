<script setup>
  import axios from "axios";
  import Header from "@/components/Header.vue";  
  import { onMounted, ref } from "vue";
  import { useToast } from 'vue-toast-notification';
  import { useRouter, useRoute } from "vue-router";
  import { useUserStore } from "@/stores/UserStore"

  const loading = ref(false)
  const modalOpen = ref(false)
  const toast = useToast();
  const router = useRouter()  
  const userStore = useUserStore()

  async function add(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-customer?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success("Customer added successfully")
      router.push({ name: 'contacts' })
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  function toggleModal() {
    modalOpen.value = !modalOpen.value
  }

  onMounted(()=>{
    
  })

</script>

<template>
  <Header title="Add Customer" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
                      
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <FormKit type="form" id="customer" submit-label="Add" @submit="add" :actions="false" >
                    <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add customer details below  </h2>
                    <hr />

                    <div class="double mt-8">
                      <FormKit type="text" name="name" label="Full Name" placeholder="Jane" outer-class="text-left"  />
                      <FormKit type="select" name="Reply" label="Reply" :options="[ 'Reply me by Email', 'Send me a message on Whatsapp', 'Use any of the above' ]"  />   
                    </div>

                    <div class="double">
                      <FormKit type="email" name="Email" label="Email" placeholder="jane@company.com" outer-class="text-left" />
                      <FormKit type="tel" name="Phone" label="Phone" placeholder="0210002314" outer-class="text-left" validation="required|phone" />
                    </div>

                    <div class="double">
                      <FormKit type="text" name="portal" label="Portal" placeholder="Cape Town" outer-class="text-left"  />
                      <FormKit type="text" name="foreignID" label="Hubspot ID" placeholder="Cape Town" outer-class="text-left"  />
                    </div>

                    <FormKit type="textarea" name="Message" label="Issue" placeholder="HVAC & Appliance Technician" outer-class="text-left"  />

                    <FormKit type="submit" label="Add Customer" />

                  </FormKit>
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
