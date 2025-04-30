<!-- wibiclick-frontend-vue/src/components/Customers/View/CustomerRelatedRecords.vue -->
<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
  relatedItems: {
    type: Array,
    required: true
  }
});

const emit = defineEmits([
  'add-related-item', 
  'reload-timeline',
  'view-estimate', 
  'view-invoice', 
  'view-payment', 
  'view-expense',
  'view-insurance',
  'view-job'
]);

// Function to handle view item events from components
const handleViewItem = (type, item) => {
  switch (type) {
    case 'estimate':
      emit('view-estimate', item);
      break;
    case 'invoice':
      emit('view-invoice', item);
      break;
    case 'payment':
      emit('view-payment', item);
      break;
    case 'expense':
      emit('view-expense', item);
      break;
    case 'insurance':
      emit('view-insurance', item);
      break;
    case 'job':
      emit('view-job', item);
      break;
  }
};
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Related Records</h2>
    <Disclosure v-for="itemGroup in relatedItems" :key="itemGroup.name" v-slot="{ open }">
      <div class="card-modern p-0 overflow-hidden">
        <DisclosureButton class="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 transition-colors">
          <div class="flex items-center">
            <font-awesome-icon :icon="itemGroup.icon" class="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
            <span>{{ itemGroup.name }}</span>
            <span class="ml-2 text-xs text-gray-500 dark:text-gray-400">({{ itemGroup.data?.length || 0 }})</span>
          </div>
          <div class="flex items-center space-x-2">
            <button v-if="itemGroup.addRoute" @click.stop="emit('add-related-item', itemGroup.addRoute, itemGroup.queryKey)" class="btn-ghost-modern p-1 h-6 w-6" :title="'Add ' + itemGroup.name">
              <font-awesome-icon icon="plus" class="h-3 w-3" />
            </button>
            <font-awesome-icon :icon="open ? 'chevron-up' : 'chevron-down'" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        </DisclosureButton>
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-out"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <DisclosurePanel class="px-4 pt-2 pb-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 max-h-96 overflow-y-auto">
            <div v-if="itemGroup.data && itemGroup.data.length > 0" class="space-y-3 mt-3">
              <!-- Render the specific component for each item -->
              <component
                v-for="item in itemGroup.data"
                :is="itemGroup.component"
                :[itemGroup.itemKey]="item"
                :key="item.id || item.uid || JSON.stringify(item)"
                @reload-timeline="emit('reload-timeline')"
                @edit-estimate="handleViewItem('estimate', $event)"
                @view-estimate="handleViewItem('estimate', $event)"
                @edit-invoice="handleViewItem('invoice', $event)"
                @view-invoice="handleViewItem('invoice', $event)"
                @edit-payment="handleViewItem('payment', $event)"
                @view-payment="handleViewItem('payment', $event)"
                @edit-expense="handleViewItem('expense', $event)"
                @view-expense="handleViewItem('expense', $event)"
                @edit-insurance="handleViewItem('insurance', $event)"
                @view-insurance="handleViewItem('insurance', $event)"
                @edit-job="handleViewItem('job', $event)"
                class="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 bg-white dark:bg-gray-800"
              />
            </div>
            <p v-else class="mt-3 text-center text-gray-500">No {{ itemGroup.name.toLowerCase() }} found.</p>
          </DisclosurePanel>
        </transition>
      </div>
    </Disclosure>
  </section>
</template>