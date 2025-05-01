// wibiclick-frontend-vue/src/views/Suppliers/Add.vue
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
      const response = await axios.post('add-supplier?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success("Supplier added successfully")
      router.push({ name: 'suppliers' })
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
  <Header title="Add Supplier" /> 
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
                      
          </div>
          <div class="mt-3 md:col-span-2">
              <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
                  <FormKit type="form" id="supplier" submit-label="Add" @submit="add" :actions="false" >
                    <h2 class="mb-2 text-2xl text-cyan-900 font-bold">Add supplier details below  </h2>
                    <hr />

                    <div class="double mt-8">
                      <FormKit type="text" name="name" label="Supplier Name" placeholder="Smeg SA" validation="required" outer-class="text-left"  />
                      <FormKit type="email" name="email" label="Supplier Email" placeholder="jane@smegsa.co.za" validation="required" outer-class="text-left" /> 
                    </div>

                    <div class="double">
                      <FormKit type="tel" name="phone" label="Phone Number" placeholder="0210002314" outer-class="text-left" validation="required|phone" />
                      <FormKit type="text" name="address" label="Address" placeholder="12 Woodstock, Cape Town" validation="required" outer-class="text-left"  />
                    </div>

                    <div class="double">
                      <FormKit type="text" name="city" label="City" placeholder="Cape Town" validation="required" outer-class="text-left"  />
                      <FormKit type="text" name="state" label="Province" placeholder="Western Cape" validation="required" outer-class="text-left"  />
                    </div>

                    <div class="double">
                      <FormKit type="text" name="zip" label="Zip" placeholder="7441" validation="required" outer-class="text-left"  />
                      <FormKit type="text" name="country" label="Country" placeholder="South Africa" validation="required" outer-class="text-left"  />
                    </div>

                    <FormKit type="text" name="contactPerson" label="Contact Person" placeholder="7441" validation="required" outer-class="text-left"  />

                    <FormKit type="submit" label="Add Supplier" />

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
