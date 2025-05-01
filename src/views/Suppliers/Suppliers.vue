// wibiclick-frontend-vue/src/views/Suppliers/Suppliers.vue
<script setup>
  import  useUserStore  from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect } from "vue";
  import moment from 'moment'
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import axios from "axios";
  import _ from 'lodash';
  import { useRouter } from "vue-router";
  import { useToast } from 'vue-toast-notification';
  import Edit from "@/components/Edit.vue";

  import { AgGridVue } from "ag-grid-vue3";
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
  import { library } from '@fortawesome/fontawesome-svg-core'
  import { faArrowLeft, faPlus, faSync, faEdit } from '@fortawesome/free-solid-svg-icons' // Added icons

  library.add(faArrowLeft, faPlus, faSync, faEdit) // Added icons
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS

  const userStore = useUserStore()
  const selectedSupplier = ref(null) // Keep for potential future edit logic differentiation
  const toast = useToast();
  const loading = ref(false)
  const options = ref()
  const series = ref()
  const paginationPageSize = ref(10)
  const modalOpen = ref(false)
  const modalMode = ref('add') // 'add' or 'edit'
  const formData = reactive({ // Centralized form data
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    contactPerson: ''
  })
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Add dark mode state
  const router = useRouter()

  options.value = {
    chart: {
      height: 350,
      type: 'bar'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      labels: {
      datetimeUTC: false
    },
      categories: []
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      },
    },
  },

  series.value = [{
      name: 'suppliers',
      data: []
  }]

  const groups = (() => {
      const byDay = (item) => moment(item.x).format('MMM DD YYYY'),
          byHour = (item) => moment(byDay(item) + ' ' + moment(item.x).format('hh a'), "dd MMM yyyy").toISOString(),
          by6Hour = (item) => {
              const m = moment(item.x);
              return byDay(item) + ' ' + ['first', 'second', 'third', 'fourth'][Number(m.format('k')) % 6] + ' 6 hours';
          },
          byMonth = (item) => moment(item.x).format('MMM YYYY'),
          byWeek = (item) => byMonth(item) + ' ' + moment(item.x).format('ww');
      return {
          byDay,
          byHour,
          by6Hour,
          byMonth,
          byWeek,
      };
  })();


  const gridApi = ref(null); 
  const onGridReady = (params) => {
    gridApi.value = params.api;
  };
  const rowData = reactive({}); 

  const dateFormatter = (params) => {
    let dt = params.value
    return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY h:mm a') : '-';
  }

  const columnDefs = reactive({
    value: [
      { 
        field: "name", 
        maxWidth: 230,
      }, 
      { field: "phone", maxWidth: 130 }, 
      { field: "contactPerson" },
      { field: "email" }, 
      { field: "city" },
      // { field: "state" },
      // { field: "zip" },
      // { field: "country" },
      // { field: "address" },       
      { field: "createdAt", valueFormatter: dateFormatter, maxWidth: 190 },  
      { 
        field: "Edit", 
        headerName: 'Edit',
        maxWidth: 80,
        cellRendererSelector: params => {
          return {
              component: Edit,
              params
          };
        } 
      }, 
    ],
  });

  const defaultColDef = {
    sortable: true,
    filter: true,
    flex: 1,
  };

  async function fetchSuppliers() {
    try {
      loading.value = true;
      const response = await axios.get(
        `suppliers?id=${userStore.currentWebsite}&limit=10000&offset=0`
      );

      rowData.value = response.data.suppliers

      let supplierss = [];

      for (const c of response.data.suppliers) {
        supplierss.push({
          x: c.createdAt,
          y: 1,
        });
      }

      const data = _.sortBy(supplierss, 'x')

      const currentGroup = 'byDay';
      const grouped = _.groupBy(data, groups[currentGroup])
      const seriesData = Object.values(grouped).map( a => a.length )
      const optionsData = Object.keys(grouped)
          
      options.value = {
          chart: {
            height: 350,
            type: 'bar',
            toolbar: {
              autoSelected: "pan",
              show: false
            } 
          },
          dataLabels: {
            enabled: false
          },
          stroke: {
            curve: 'smooth'
          },
          xaxis: {
            type: 'datetime',
            labels: {
      datetimeUTC: false
    },
            categories: optionsData,
            labels: {
              style: {
                colors: isDarkMode.value ? '#E5E7EB' : '#374151' // Dynamic color based on dark mode
              }
            }
          },
          yaxis: {
            min: 0,
            tickAmount: 4,
            labels: {
              style: {
                colors: isDarkMode.value ? '#E5E7EB' : '#374151' // Dynamic color based on dark mode
              }
            }
          },
          fill: {
            gradient: {
              enabled: true,
              opacityFrom: 0.55,
              opacityTo: 0
            }
          },
          grid: {
            borderColor: "#fff",
            strokeDashArray: 2,
            clipMarkers: false,
            yaxis: {
              lines: {
                show: true
              }
            }
          },
          markers: {
            size: 0, // Hide markers for cleaner look
            colors: ["#ffffff"],
            strokeColor: "#00BAEC",
            strokeWidth: 3
          },
          tooltip: {
            theme: "dark",
            x: {
              format: 'dd MMM yyyy'
            },
          },
      }
      series.value = [{
        name: 'suppliers',
        data: seriesData
      }]

      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting suppliers data")
    }
  }

  // Renamed from 'update' - This function handles adding a supplier
  async function addSupplier(credentials) {
    try {
      loading.value = true
      // Use credentials passed from the form
      const { data } = await axios.post('add-supplier?id='+ userStore.currentWebsite, {data: credentials});
      loading.value = false
      toast.success(data.message || 'Supplier added successfully') // Use response message or default
      modalOpen.value = false // Close modal on success
      fetchSuppliers() // Refresh data
    } catch (error) {
      console.error("Error adding supplier:", error); // Log error details
      loading.value = false
      toast.error(error.response?.data?.message || "Error adding supplier") // Show specific error or generic
    }
  }

  // Placeholder for actual update logic if needed later
  async function updateSupplier(credentials) {
    console.warn("Update Supplier functionality not fully implemented yet. Using add endpoint for now.");
    // Ideally, this would POST/PUT to something like `suppliers/${credentials.id}`
    // For now, mimicking the old behavior (which used the add endpoint)
    await addSupplier(credentials); // Or show a message that update isn't ready
    // try {
    //   loading.value = true;
    //   const supplierId = formData.id; // Assuming ID is stored in formData during edit
    //   if (!supplierId) throw new Error("Supplier ID missing for update.");
    //   const { data } = await axios.put(`suppliers/${supplierId}?id=${userStore.currentWebsite}`, { data: credentials });
    //   loading.value = false;
    //   toast.success(data.message || 'Supplier updated successfully');
    //   modalOpen.value = false;
    //   fetchSuppliers();
    // } catch (error) {
    //   console.error("Error updating supplier:", error);
    //   loading.value = false;
    //   toast.error(error.response?.data?.message || "Error updating supplier");
    // }
  }

  // Handles form submission based on mode
  async function handleFormSubmit(credentials) {
    if (modalMode.value === 'add') {
      await addSupplier(credentials);
    } else if (modalMode.value === 'edit') {
      // Pass the ID along with other credentials if needed by the backend
      await updateSupplier({ ...credentials, id: formData.id });
    }
  }

  // Opens the modal and sets the mode and form data
  const openModal = (mode, supplierData = null) => {
    modalMode.value = mode;
    if (mode === 'add') {
      // Reset formData for adding a new supplier
      Object.keys(formData).forEach(key => formData[key] = ''); // Reset all fields
      formData.id = null; // Ensure ID is null for add mode
    } else if (mode === 'edit' && supplierData) {
      // Populate formData with existing supplier data for editing
      Object.keys(formData).forEach(key => {
        formData[key] = supplierData[key] !== undefined ? supplierData[key] : ''; // Handle potential undefined fields
      });
      formData.id = supplierData.id; // Store the ID for update logic
      selectedSupplier.value = supplierData; // Keep selectedSupplier updated if needed elsewhere
    } else if (mode === 'edit') {
       console.error("Attempted to open edit modal without supplier data.");
       toast.error("Could not load supplier data for editing.");
       return; // Don't open modal if data is missing for edit
    }
    modalOpen.value = true;
  };

  // Modified grid click handler to use openModal
  const handleGridClick = (event) => {
    // Check if the click is on a cell and not header/empty space
    // Also check if the click was specifically on the 'Edit' button cell if applicable
    // For simplicity, assuming any row click should open edit for now, refine if needed.
    if (event.data && event.colDef.field === 'Edit') { // Ensure click is on data row and Edit column
       openModal('edit', event.data);
    }
  };

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value); // Toggle dark class on html element
    if(userStore.currentWebsite){
      fetchSuppliers()
    }
  })

  function handleNavigateBack() {
    router.back();
  }

</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-3">
          <button @click="handleNavigateBack" class="btn-icon-modern" title="Go Back">
            <font-awesome-icon icon="arrow-left" />
          </button>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Suppliers
            </h1>
            <!-- Optional: Add subtitle like customer count -->
            <p v-if="rowData.value?.length" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ rowData.value.length }} {{ rowData.value.length === 1 ? 'supplier' : 'suppliers' }} found
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
           <button @click="fetchSuppliers" class="btn-icon-modern" title="Refresh Data" aria-label="Refresh supplier data">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
           </button>
          <!-- Modified Add Supplier Button -->
          <button @click="openModal('add')" class="btn-primary-modern" title="Add New Supplier">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Supplier
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="space-y-6 lg:space-y-8"> <!-- Added spacing -->
      <div>
        <div class="">
          <div class="md:col-span-1">
            
          </div>
          <div class="mt-3 md:col-span-2">
             
              <!-- Suppliers Table Card -->
              <section class="card-modern p-5 sm:p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Supplier List</h2>
                  <ag-grid-vue
                      :class="isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'"
                      style="height: 521px"
                      :columnDefs="columnDefs.value"
                      :rowData="rowData.value"
                      :defaultColDef="defaultColDef"
                      :pagination="true"
                      :paginationPageSize="paginationPageSize"
                      rowSelection="multiple"
                      animateRows="true"
                      @grid-ready="onGridReady"
                      @cell-clicked="handleGridClick" 
                    >
                  </ag-grid-vue>
              </section>

              <!-- Chart Card -->
              <section class="card-modern p-5 sm:p-6 mt-6 lg:mt-8"> <!-- Added margin top -->
                <div class="flex flex-wrap items-center mb-4">
                  <div class="relative w-full max-w-full flex-grow flex-1">
                    <h3 class="text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overview</h3>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mt-1">New Suppliers Trend</h2>
                  </div>
                </div>
                <apexchart type="bar" height="350" :options="options" :series="series"></apexchart>
              </section>
          </div>
        </div>
      </div>

      <!-- Removed divider -->

    </div>
  </div>

  <div id="modalOpen" tabindex="-1" :class="{ flex: modalOpen, hidden: !modalOpen }" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 w-full md:inset-0 h-modal md:h-full justify-center items-center">
    <div class="relative p-4 w-full max-w-2xl max-h-full"> <!-- Adjusted max-h -->
      <!-- Modal content -->
      <div class="relative bg-white rounded-xl shadow-xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700"> <!-- Modern card styling -->
        <!-- Modal header -->
        <div class="flex justify-between items-center p-4 sm:p-5 rounded-t border-b dark:border-gray-700"> <!-- Adjusted padding -->
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ modalMode === 'add' ? 'Add New Supplier' : 'Update Supplier Details' }}
          </h3>
          <button ref="closeDefaultModal" type="button"
            class="btn-icon-modern text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="modalOpen = false">
            <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
        <!-- Modal body -->
        <div class="p-6 space-y-6">
          <!-- Bind form submission to handleFormSubmit and use formData -->
          <!-- Conditionally render based on modalOpen instead of selectedSupplier -->
          <FormKit type="form" v-if="modalOpen" id="supplierForm" @submit="handleFormSubmit" :actions="false" #default="{ state: { dirty } }">

            <div class="double mb-4"> <!-- Added margin-bottom -->
              <FormKit type="text" name="name" v-model="formData.name" label="Supplier Name" placeholder="Smeg SA" validation="required" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
              <FormKit type="email" name="email" v-model="formData.email" label="Supplier Email" placeholder="jane@smegsa.co.za" validation="email" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
            </div>

            <div class="double mb-4"> <!-- Added margin-bottom -->
              <FormKit type="tel" name="phone" v-model="formData.phone" label="Phone Number" placeholder="0210002314" validation="required|phone" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
              <FormKit type="text" name="address" v-model="formData.address" label="Address" placeholder="12 Woodstock, Cape Town" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
            </div>

            <div class="double mb-4"> <!-- Added margin-bottom -->
              <FormKit type="text" name="city" v-model="formData.city" label="City" placeholder="Cape Town" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
              <FormKit type="text" name="state" v-model="formData.state" label="Province" placeholder="Western Cape" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
            </div>

            <div class="double mb-4"> <!-- Added margin-bottom -->
              <FormKit type="text" name="zip" v-model="formData.zip" label="Zip" placeholder="7441" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
              <FormKit type="text" name="country" v-model="formData.country" label="Country" placeholder="South Africa" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->
            </div>

            <FormKit type="text" class="mb-6" name="contactPerson" v-model="formData.contactPerson" label="Contact Person" placeholder="John Doe" label-class="text-gray-700 dark:text-gray-300" /> <!-- Adjusted label color -->

            <!-- Use FormKit submit slot for custom button styling -->
            <FormKit class="bg-transparent border-none p-0" >
              <span class="mt-6 btn-primary-modern w-full justify-center" :class="{ 'opacity-50 cursor-not-allowed': !dirty || loading }"> <!-- Adjusted button style with border -->
                {{ loading ? (modalMode === 'add' ? 'Adding...' : 'Updating...') : (modalMode === 'add' ? 'Add Supplier' : 'Update Supplier') }}
              </span>
            </FormKit>

          </FormKit>
        </div>
      </div>
    </div>
  </div>

  <div v-if="modalOpen" class="bg-gray-900 bg-opacity-50 dark:bg-opacity-80 fixed inset-0 z-40"></div>
</div> <!-- Close main container div -->
</template>
