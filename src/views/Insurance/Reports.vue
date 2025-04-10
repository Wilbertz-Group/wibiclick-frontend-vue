<script setup>
  import axios from "axios";
  // Removed Header import
  import { useUserStore } from "@/stores/UserStore"
  import { onMounted, ref, reactive, watchEffect, computed, nextTick, watch, h, render } from "vue"; // Added h and render for component rendering
  import moment from 'moment'
  import _ from 'lodash';
  import { useRouter } from "vue-router";
  import { useToast } from 'vue-toast-notification';
  import ScaleLoader from 'vue-spinner/src/ScaleLoader.vue'
  import { AgGridVue } from "ag-grid-vue3";
  import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
  import "ag-grid-community/styles/ag-theme-balham.css"; // Optional theme CSS (needed for dark mode potentially)
  
  // Custom CSS for enhanced table styling
  import "./insurance-reports-table.css"; // Import custom table styling
  import Edit from "@/components/insurance/Edit.vue";
  import View from "@/components/insurance/View.vue";
  import Status from "@/components/insurance/Status.vue";
  // Removed Draggable import as it's not used in the target design
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome' // Added FontAwesome
  import { library } from '@fortawesome/fontawesome-svg-core' // Added FontAwesome library
  import { faArrowLeft, faPlus, faSync, faEdit, faEye, faFileInvoiceDollar, faChartLine } from '@fortawesome/free-solid-svg-icons' // Added icons
  import { tooltips } from '../../helpers'; // Added tooltips helper

  // Add FontAwesome icons to the library
  library.add(faArrowLeft, faPlus, faSync, faEdit, faEye, faFileInvoiceDollar, faChartLine)

  const userStore = useUserStore()
  const toast = useToast();
  const loading = ref(false)
  const isDarkMode = ref(localStorage.getItem('darkMode') === 'true') // Add dark mode state
  const options = ref({}) // Initialize as object
  const series = ref([]) // Initialize as array
  const router = useRouter()

  const selectedInsurance = ref({})
  const paginationPageSize = ref(12)
  const modalOpen = ref(false)
  const status = ref(userStore.status)
  const insurancesApi = ref([])
  const insurancesStatusesApi = ref([])
  // Removed unused colors ref

  options.value = {
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: true, // Show toolbar for zoom functionality
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'zoom' // Auto-select zoom tool
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      foreColor: isDarkMode.value ? '#e5e7eb' : '#374151'
    },
    plotOptions: {
      area: {
        fillTo: 'end'
      },
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        borderRadius: 4
      },
    },
    dataLabels: {
      enabled: false // Disable data labels for cleaner look
    },
    stroke: {
      show: true,
      width: 3,
      curve: 'smooth',
      lineCap: 'round'
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      floating: false,
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      formatter: undefined,
      inverseOrder: false,
      offsetX: 0,
      offsetY: 0,
      labels: {
        colors: isDarkMode.value ? '#e5e7eb' : '#374151'
      },
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        strokeColor: '#fff',
        radius: 12
      },
      itemMargin: {
        horizontal: 8,
        vertical: 0
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    xaxis: {
      type: 'datetime',
      categories: [],
      labels: {
        datetimeUTC: false,
        style: {
          colors: isDarkMode.value ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        format: 'dd MMM'
      },
      axisBorder: {
        color: isDarkMode.value ? '#4b5563' : '#e5e7eb'
      },
      axisTicks: {
        color: isDarkMode.value ? '#4b5563' : '#e5e7eb'
      }
    },
    yaxis: {
      title: {
        text: 'Reports Count',
        style: {
          color: isDarkMode.value ? '#9ca3af' : '#6b7280',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500
        }
      },
      labels: {
        style: {
          colors: isDarkMode.value ? '#9ca3af' : '#6b7280',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif'
        },
        formatter: function(val) {
          return val.toFixed(0)
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: isDarkMode.value ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    tooltip: {
      theme: isDarkMode.value ? 'dark' : 'light',
      shared: true,
      intersect: false,
      followCursor: true,
      marker: {
        show: true
      },
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: function (val) {
          return val + " reports"
        },
        title: {
          formatter: (seriesName) => seriesName
        }
      }
    },
    grid: {
      borderColor: isDarkMode.value ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    colors: ['#4f46e5', '#10b981', '#f59e0b'], // Primary, success, warning colors
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom',
            horizontalAlign: 'center'
          }
        }
      }
    ]
  }

  series.value = [
    {
      name: 'Insurance Reports',
      data: []
    }
  ]
  
  // Add time period selection state
  const selectedTimePeriod = ref('byDay')
  const timePeriodOptions = [
    { value: 'byDay', label: 'Daily' },
    { value: 'byWeek', label: 'Weekly' },
    { value: 'byMonth', label: 'Monthly' }
  ]

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

  async function fetchInsurances() {
    try {
      loading.value = true;
      const response = await axios.get(
        `insurance-reports?id=${userStore.currentWebsite}&limit=1500&offset=0`
      );
  
      rowData.value = response.data.insurance
  
      let fInsurances = {}, estAp = []
  
      response.data.insurance.forEach((itm) => {
        if (fInsurances[itm.status]) {
          fInsurances[itm.status].push(itm);
        } else {
          fInsurances[itm.status] = [itm];
        }
      });
  
      Object.keys(fInsurances).forEach((itm) => {
        estAp.push({
          title: itm,
          insurances: fInsurances[itm]
        })
      });
  
      insurancesApi.value = estAp.filter(e => e);
  
      insurancesStatusesApi.value = Object.keys(fInsurances)
  
      // Process data for chart
      updateChartData(response.data.insurance);
  
      loading.value = false;
    } catch (error) {
      console.log(error);
      loading.value = false;
      toast.error("Error getting insurance reports data")
    }
  }
  
  // Function to update chart data based on selected time period
  function updateChartData(insuranceData) {
    if (!insuranceData || insuranceData.length === 0) {
      series.value = [{ name: 'Insurance Reports', data: [] }];
      options.value.xaxis.categories = [];
      return;
    }
  
    let insurancess = [];
  
    for (const insurance of insuranceData) {
      insurancess.push({
        x: insurance.issuedAt,
        y: 1,
      });
    }
  
    const data = _.sortBy(insurancess, 'x');
    
    // Group data by selected time period
    const currentGroup = selectedTimePeriod.value;
    const grouped = _.groupBy(data, groups[currentGroup]);
    
    // Create series data for each status
    const seriesData = Object.values(grouped).map(a => a.length);
    const optionsData = Object.keys(grouped);
    
    // Format x-axis labels based on time period and determine axis type
    let xaxisFormat = 'dd MMM';
    let xaxisType = 'datetime';
    
    // For weekly and monthly views, we'll use category type instead of datetime
    // This avoids the need for JavaScript Date objects
    if (currentGroup === 'byMonth') {
      xaxisFormat = 'MMM yyyy';
      xaxisType = 'category';
    } else if (currentGroup === 'byWeek') {
      xaxisFormat = 'wo [week] yyyy'; // Week number format
      xaxisType = 'category';
    }
    
    // Update chart options
    options.value = {
      ...options.value,
      chart: {
        ...options.value.chart,
        foreColor: isDarkMode.value ? '#e5e7eb' : '#374151'
      },
      xaxis: {
        ...options.value.xaxis,
        type: xaxisType, // Use the determined axis type
        categories: optionsData,
        labels: {
          ...options.value.xaxis.labels,
          format: xaxisType === 'datetime' ? xaxisFormat : undefined, // Only use format for datetime type
          style: {
            colors: isDarkMode.value ? '#9ca3af' : '#6b7280'
          }
        },
        axisBorder: {
          color: isDarkMode.value ? '#4b5563' : '#e5e7eb'
        },
        axisTicks: {
          color: isDarkMode.value ? '#4b5563' : '#e5e7eb'
        }
      },
      yaxis: {
        ...options.value.yaxis,
        labels: {
          ...options.value.yaxis.labels,
          style: {
            colors: isDarkMode.value ? '#9ca3af' : '#6b7280'
          }
        },
        title: {
          ...options.value.yaxis.title,
          text: currentGroup === 'byDay' ? 'Daily Reports' :
                currentGroup === 'byWeek' ? 'Weekly Reports' : 'Monthly Reports',
          style: {
            color: isDarkMode.value ? '#9ca3af' : '#6b7280'
          }
        }
      },
      tooltip: {
        ...options.value.tooltip,
        theme: isDarkMode.value ? 'dark' : 'light'
      },
      grid: {
        ...options.value.grid,
        borderColor: isDarkMode.value ? '#374151' : '#e5e7eb'
      }
    };
    
    // Update series data
    series.value = [{
      name: currentGroup === 'byDay' ? 'Daily Reports' :
            currentGroup === 'byWeek' ? 'Weekly Reports' : 'Monthly Reports',
      data: seriesData
    }];
    
    // Add status breakdown if we have status data
    if (insurancesStatusesApi.value.length > 0) {
      // Group by status and time period
      const statusSeries = [];
      
      // Only add status breakdown for certain views to avoid clutter
      if (currentGroup !== 'byDay' || optionsData.length < 15) {
        insurancesStatusesApi.value.slice(0, 2).forEach(status => {
          const statusData = insuranceData.filter(item => item.status === status);
          const statusPoints = statusData.map(item => ({
            x: item.issuedAt,
            y: 1
          }));
          
          const sortedStatusData = _.sortBy(statusPoints, 'x');
          const groupedStatus = _.groupBy(sortedStatusData, groups[currentGroup]);
          const statusSeriesData = [];
          
          // Ensure all categories have values (even if zero)
          optionsData.forEach(category => {
            const count = groupedStatus[category]?.length || 0;
            statusSeriesData.push(count);
          });
          
          statusSeries.push({
            name: status,
            data: statusSeriesData
          });
        });
        
        // Add status series if we have any
        if (statusSeries.length > 0) {
          series.value = [series.value[0], ...statusSeries];
        }
      }
    }
  }
  
  // Watch for time period changes
  watch(selectedTimePeriod, () => {
    if (rowData.value && rowData.value.length > 0) {
      updateChartData(rowData.value);
    }
  });
const gridApi = ref(null);
const onGridReady = (params) => {
  gridApi.value = params.api;
  // Auto-size columns on ready and data changes
  // params.api.sizeColumnsToFit(); // Consider if needed, might conflict with flex
};
  const rowData = reactive({}); 

  const dateFormatter = (params) => {
    let dt = params.value
    return params.value ? moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format('MMM DD, YYYY') : '-';
  }

  const nameFormatter = (params) => {
    return  params.data.employee.firstName + ' ' + params.data.employee.lastName
  }

  const universalDateFormatter = (dat) => {
    let dt = dat
    return moment().isSame(dt, 'day') ? moment(dt).format('h:mm a') : moment(dt).format("dddd, DD MMMM YYYY");
  }

  const amountFormatter = (params) => {
    return  'R' + params.data.sales
  }

  const columnDefs = reactive({
    value: [
      {
        field: "number",
        headerName: 'Insurance #',
        sort: 'desc',
        minWidth: 140,
        maxWidth: 180,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        cellClass: 'font-medium text-gray-900 dark:text-gray-100'
      },
      {
        field: "customer.name",
        headerName: 'Client',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        minWidth: 180,
        cellRenderer: (params) => {
            if (!params.value) return '';
            const link = document.createElement("a");
            link.href = '#'; // Prevent default navigation
            link.classList.add("text-indigo-600", "hover:text-indigo-800", "dark:text-indigo-400", "dark:hover:text-indigo-300", "font-medium", "hover:underline");
            link.innerText = params.value;
            link.addEventListener("click", e => {
              e.preventDefault();
              if (params.data.customer?.id) {
                  router.push({ path: '/contact', query: { customer_id: params.data.customer.id } })
              } else {
                  toast.warning("Customer ID not found for this report.");
              }
            });
            return link;
        }
      },
      {
        field: "issuedAt",
        headerName: 'Issued',
        valueFormatter: dateFormatter,
        filter: 'agDateColumnFilter',
        floatingFilter: true,
        minWidth: 130,
        maxWidth: 150,
        cellClass: 'text-gray-700 dark:text-gray-300'
      },
      {
        field: "status",
        headerName: 'Status',
        minWidth: 140,
        maxWidth: 160,
        filter: 'agSetColumnFilter',
        floatingFilter: false,
        cellRendererSelector: params => {
          return { component: Status, params };
        },
        cellClass: 'flex justify-center'
      },
      {
        field: "id",
        headerName: 'Actions',
        minWidth: 200,
        maxWidth: 220,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const container = document.createElement('div');
          container.className = 'flex items-center justify-center space-x-2';
          
          // Create a wrapper for the Edit component
          const editWrapper = document.createElement('div');
          const editInstance = h(Edit, { params });
          render(editInstance, editWrapper);
          
          // Create a wrapper for the View component
          const viewWrapper = document.createElement('div');
          const viewInstance = h(View, { params });
          render(viewInstance, viewWrapper);
          
          // Add both components to the container
          container.appendChild(editWrapper);
          container.appendChild(viewWrapper);
          
          return container;
        },
        cellClass: 'flex justify-center'
      }
    ],
  });

  const defaultColDef = {
    sortable: true,
    filter: true,
    flex: 1,
    resizable: true,
    suppressMovable: false,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem 1rem'
    },
    headerClass: 'text-gray-700 dark:text-gray-300 font-semibold'
  }

  async function update(credentials) {
    try {
      loading.value = true
      const response = await axios.post('add-insurance-report?id='+ userStore.currentWebsite, credentials);
      loading.value = false
      modalOpen.value = false
      fetchInsurances() 
      toast.success("Successfully updated insurance report details")
    } catch (error) {
      console.log(error)
      loading.value = false
    }
  }

  const toggleEditModal = (event) => {
    if( event.value === undefined ){
      let data = event.data
      data.issuedAt = moment(data.issuedAt).format('YYYY-MM-DDTHH:MM')
      selectedInsurance.value = data      
      modalOpen.value = !modalOpen.value
    } 
  }

  // onMounted(() => {
  //   if(userStore.currentWebsite && userStore.user){
  //     fetchInsurances()  
  //   }
  // })

  // Computed property for dynamic grid theme
  const gridTheme = computed(() => {
    return isDarkMode.value ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
  });

  // Watch for dark mode changes to update theme-related options
  watch(isDarkMode, (newVal) => {
    document.documentElement.classList.toggle('dark', newVal);
    // Update only theme-dependent chart options
    options.value = {
      ...options.value,
      chart: {
        ...options.value.chart,
        foreColor: newVal ? '#e5e7eb' : '#374151'
      },
      legend: {
        ...options.value.legend,
        labels: {
          colors: newVal ? '#e5e7eb' : '#374151'
        }
      },
      fill: {
        ...options.value.fill,
        gradient: {
          ...options.value.fill.gradient,
          shade: newVal ? 'dark' : 'light'
        }
      },
      xaxis: {
        ...options.value.xaxis,
        // Preserve the current xaxis type when updating for dark mode
        type: options.value.xaxis.type,
        labels: {
          ...options.value.xaxis.labels,
          style: { colors: newVal ? '#9ca3af' : '#6b7280' }
        },
        axisBorder: { color: newVal ? '#4b5563' : '#e5e7eb' },
        axisTicks: { color: newVal ? '#4b5563' : '#e5e7eb' }
      },
      yaxis: {
        ...options.value.yaxis,
        labels: {
          ...options.value.yaxis.labels,
          style: { colors: newVal ? '#9ca3af' : '#6b7280' }
        },
        title: {
          ...options.value.yaxis.title,
          style: { color: newVal ? '#9ca3af' : '#6b7280' }
        }
      },
      tooltip: {
        ...options.value.tooltip,
        theme: newVal ? 'dark' : 'light'
      },
      grid: {
        ...options.value.grid,
        borderColor: newVal ? '#374151' : '#e5e7eb'
      }
    };
    
    // Re-initialize tooltips after theme change
    nextTick(() => {
      tooltips();
    });
    
    // Update chart data with new theme
    if (rowData.value && rowData.value.length > 0) {
      updateChartData(rowData.value);
    }
  });

  // Watch for website changes to refetch data
  watch(() => userStore.currentWebsite, (newWebsiteId) => {
    if (newWebsiteId) {
      fetchInsurances();
    } else {
      // Clear data if website is deselected
      rowData.value = [];
      series.value = [{ name: 'Insurance Reports', data: [] }];
      options.value.xaxis.categories = [];
    }
  }, { immediate: false }); // Don't run immediately, onMounted handles initial load

  onMounted(() => {
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    // Initial fetch if website is already selected
    if(userStore.currentWebsite && userStore.user){
      fetchInsurances()
    }
    // Initialize tooltips on mount
    nextTick(() => {
        tooltips();
    });
  })

</script>

<template>
  <!-- Main container with background and padding -->
  <div :class="{ 'dark': isDarkMode }" class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-blue-950 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
    <scale-loader :loading="loading" color="#4f46e5" height="50px" class="vld-overlay is-active is-full-page" width="6px"></scale-loader> <!-- Updated color -->

    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

      <!-- Header Section -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 space-y-4 sm:space-y-0">
        <div class="flex items-center space-x-3">
          <button @click="router.back()" class="btn-icon-modern" title="Go Back">
            <font-awesome-icon icon="arrow-left" />
          </button>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Insurance Reports
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage and view insurance report details.</p>
          </div>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
           <button @click="fetchInsurances" class="btn-icon-modern" title="Refresh Data" aria-label="Refresh insurance reports">
             <font-awesome-icon icon="sync" :class="{ 'fa-spin': loading }" />
           </button>
          <router-link :to="{name: 'add-insurance-report'}" class="btn-primary-modern" title="Add New Insurance Report">
            <font-awesome-icon icon="plus" class="mr-1.5 h-4 w-4" /> Add Report
          </router-link>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="space-y-6 lg:space-y-8">

        <!-- Chart Card -->
        <section class="card-modern p-5 sm:p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <font-awesome-icon icon="chart-line" class="mr-2 text-indigo-500" />
            Report Trends
          </h2>
          <div v-if="series.length > 0 && series[0].data.length > 0">
            <div class="mb-4 flex flex-wrap items-center justify-between">
              <div class="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                Select time period:
              </div>
              <div class="flex space-x-2">
                <button
                  v-for="option in timePeriodOptions"
                  :key="option.value"
                  @click="selectedTimePeriod = option.value"
                  :class="[
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    selectedTimePeriod === option.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <apexchart type="area" height="350" :options="options" :series="series"></apexchart>
          </div>
          <div v-else class="text-center py-10 text-gray-500 dark:text-gray-400">
            No data available for chart.
          </div>
        </section>

        <!-- Table Card -->
        <section class="card-modern overflow-hidden"> <!-- Added overflow-hidden -->
           <div class="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 dark:border-gray-700/50">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <font-awesome-icon icon="file-invoice-dollar" class="mr-2 text-indigo-500" />
                All Insurance Reports
              </h2>
              
              <!-- Search and filter controls -->
              <div class="flex items-center space-x-2">
                <div class="relative">
                  <input
                    type="text"
                    placeholder="Search reports..."
                    class="pl-9 pr-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-300 w-48 md:w-64"
                  />
                  <div class="absolute left-3 top-2.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
           </div>

           <div class="p-0 sm:p-0"> <!-- Removed padding for better table appearance -->
              <div v-if="userStore.currentWebsite" class="insurance-reports-table">
                <ag-grid-vue
                    :class="gridTheme"
                    style="height: 580px; width: 100%; border-radius: 0;"
                    :columnDefs="columnDefs.value"
                    :rowData="rowData.value"
                    :defaultColDef="defaultColDef"
                    :pagination="true"
                    :paginationPageSize="paginationPageSize"
                    rowSelection="multiple"
                    animateRows="true"
                    @grid-ready="onGridReady"
                    @cell-clicked="toggleEditModal"
                    :tooltipShowDelay="0"
                    :tooltipHideDelay="2000"
                    enableCellTextSelection="true"
                    suppressCellFocus="true"
                    suppressRowHoverHighlight="false"
                    :rowHeight="52"
                    :headerHeight="48"
                  >
                </ag-grid-vue>
              </div>
              <div v-else class="text-center py-10 text-gray-500 dark:text-gray-400">
                Please select a website from the navigation first.
              </div>
           </div>
        </section>

      </div> <!-- End Main Content Area -->

    </div> <!-- End Container -->

  <!-- Edit Modal -->
  <div id="editInsuranceModal" tabindex="-1" aria-hidden="true" :class="{ 'flex': modalOpen, 'hidden': !modalOpen }" class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 dark:bg-opacity-80">
    <div class="relative p-4 w-full max-w-2xl max-h-full">
      <!-- Modal content -->
      <div class="relative card-modern"> <!-- Applied modern card styling -->
        <!-- Modal header -->
        <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Insurance Report #{{ selectedInsurance.number }}
          </h3>
          <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" @click="modalOpen = false">
            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
            <span class="sr-only">Close modal</span>
          </button>
        </div>
      <!-- Removed misplaced closing div -->
        <!-- Modal body -->
        <div class="p-4 md:p-5 space-y-4">
          <!-- FormKit Integration -->
          <FormKit type="form" v-if="selectedInsurance && selectedInsurance.id" id="insuranceEditForm" @submit="update" :actions="false" #default="{ value }"> <!-- Added check for selectedInsurance.id -->

            <FormKit type="hidden" v-model="selectedInsurance.jobId" name="jobId" />
            <FormKit type="hidden" v-model="selectedInsurance.id" name="id" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormKit type="select" v-model="selectedInsurance.status" name="status" label="Report Stage" :options="status" validation="required" />
              <FormKit type="text" v-model="selectedInsurance.name" name="name" label="Report Name" placeholder="e.g., Claim Assessment" validation="required" />
            </div>

            <div class="mb-4">
              <FormKit type="text" v-model="selectedInsurance.number" name="number" label="Report Number" placeholder="e.g., INS-12345" validation="required" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
               <FormKit type="datetime-local" v-model="selectedInsurance.issuedAt" name="issuedAt" label="Issued Date" validation="required" />
               <FormKit
                  type="number"
                  v-model="selectedInsurance.amount"
                  name="amount"
                  label="Claim Amount (R)"
                  placeholder="e.g., 1500.00"
                  step="0.01"
                  validation="number|min:0"
                />
            </div>

            <div class="mb-4">
              <FormKit type="textarea" v-model="selectedInsurance.notes" name="notes" label="Notes / Summary" placeholder="Add relevant notes or summary..." rows="4" />
            </div>

            <!-- Modal footer -->
            <div class="flex items-center justify-end pt-4 border-t border-gray-200 rounded-b dark:border-gray-600">
               <button @click="modalOpen = false" type="button" class="btn-secondary-modern mr-3">Cancel</button>
               <FormKit type="submit" label="Update Report" outer-class="!mb-0" input-class="btn-primary-modern" /> <!-- Use FormKit submit with modern class -->
            </div>

          </FormKit>
           <div v-else class="text-center text-gray-500 dark:text-gray-400 py-6">
              Loading report details...
           </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal background overlay removed, handled by the main modal div -->

</div> <!-- End Main Container -->
</template>

<style>
      /* Modern button styles */
      .btn-icon-modern {
        @apply flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900;
      }
      
      .btn-primary-modern {
        @apply inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out dark:focus:ring-offset-gray-900;
      }
      
      .btn-secondary-modern {
        @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out dark:focus:ring-offset-gray-900;
      }
      
      .card-modern {
        @apply bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 ease-in-out;
      }
    </style>