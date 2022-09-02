<script setup>
import Header from "@/components/Header.vue";
import { useUserStore } from "@/stores/UserStore";
import { onMounted, ref, reactive, watchEffect } from "vue";
import moment from "moment";

import { AgGridVue } from "ag-grid-vue3";
import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS, always needed
import "ag-grid-community/styles/ag-theme-alpine.css"; // Optional theme CSS
import Actions from "@/components/Actions.vue";

const userStore = useUserStore();
const gridApi = ref(null); 
const onGridReady = (params) => {
  gridApi.value = params.api;
};
const rowData = reactive({}); 
const columnDefs = reactive({
  value: [
    { field: "make" }, 
    { field: "model" }, 
    { 
      field: "price",
      cellRendererSelector: (p) => {
        if (p.value === 320200) {
          return {
            component: Actions,
            params: {},
          };
        }
      },
    },
    { field: "actions", cellRenderer: Actions }, 
  ],
});
const defaultColDef = {
  sortable: true,
  filter: true,
  flex: 1,
};
const cellWasClicked = (event) => {
  console.log("cell was clicked", event);
};
const deselectRows = () => {
  gridApi.value.deselectAll();
};

// Example load data from sever
onMounted(() => {
  fetch("https://www.ag-grid.com/example-assets/row-data.json")
    .then((result) => result.json())
    .then((remoteRowData) => (rowData.value = remoteRowData));
});

watchEffect(() => {
  if (userStore.currentWebsite) {
    if (grid.callbacks == undefined) {
      grid.render(customersNode.value);
    } else {
      grid.forceRender();
    }
  }
});
</script>

<template>
  <Header title="Invoices" />
  <div class="mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div>
        <div class="">
          <div class="md:col-span-1">
            <div
              class="grid gap-3 text-right lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1"
            >
              <div></div>
              <div class="relative text-right"></div>
              <div class="relative text-right">
                
              </div>
            </div>
          </div>
          <div class="mt-3 md:col-span-2">
            <div class="shadow p-10 sm:rounded-md sm:overflow-hidden">
              <button @click="deselectRows">deselect rows</button>
              <ag-grid-vue
                class="ag-theme-alpine"
                style="height: 500px"
                :columnDefs="columnDefs.value"
                :rowData="rowData.value"
                :defaultColDef="defaultColDef"
                rowSelection="multiple"
                animateRows="true"
                @cell-clicked="cellWasClicked"
                @grid-ready="onGridReady"
              >
              </ag-grid-vue>
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
