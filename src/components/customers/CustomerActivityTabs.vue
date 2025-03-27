<script setup>
import { defineProps } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';

// Import all necessary accordion components used within the tabs
import accordionPayment from '@/components/payments/PaymentAccordion.vue';
import accordionJob from '@/components/jobs/accordion.vue';
import accordionCustomer from '@/components/customers/accordion.vue';
import accordionView from '@/components/analytics/accordionView.vue';
import accordionClick from '@/components/analytics/accordionClick.vue';
import accordionForm from '@/components/analytics/accordionForm.vue';
import accordionLineitem from '@/components/line-items/accordion.vue';
import accordionWhatsapp from '@/components/whatsapp/accordion.vue'; // Renamed from 'accordion' for clarity
import accordionEmail from '@/components/email/accordion.vue';
import accordionNotes from '@/components/notes/accordion.vue';
import accordionInvoice from '@/components/invoices/accordion.vue';
import accordionEstimate from '@/components/estimates/accordion.vue';
import accordionInsurance from '@/components/insurance/accordion.vue';

const props = defineProps({
  customer: {
    type: Object,
    required: true,
    default: () => ({ activities: [], whatsapp: [], notes: [] }) // Provide default structure
  },
  wkey: { // Key for forcing whatsapp accordion re-render
    type: Number,
    default: 0
  },
  nkey: { // Key for forcing notes accordion re-render
    type: Number,
    default: 0
  }
});

// Helper function to get the correct accordion component based on activity type
// (Could be further optimized as discussed in Step 2 later)
function getActivityComponent(activityType) {
  switch (activityType) {
    case 'whatsapp': return accordionWhatsapp;
    case 'payment': return accordionPayment;
    case 'email': return accordionEmail;
    case 'note': return accordionNotes;
    case 'invoice': return accordionInvoice;
    case 'estimate': return accordionEstimate;
    case 'insurance': return accordionInsurance;
    case 'job': return accordionJob;
    case 'customer': return accordionCustomer;
    case 'line item': return accordionLineitem;
    case 'view': return accordionView;
    // 'click' and 'form' are handled via conditional v-if below for now
    default: return null; // Or a default placeholder component
  }
}

// Helper function to get props for the activity component
// (Could be further optimized as discussed in Step 2 later)
function getActivityProps(activity) {
    switch (activity.type) {
        case 'whatsapp': return { msgs: [activity?.whatsapp] };
        case 'payment': return { payments: [activity?.payment], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'email': return { msgs: [activity?.email] };
        case 'note': return { notes: [activity?.notes], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'invoice': return { invoices: [activity?.invoice], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'estimate': return { estimates: [activity?.estimate], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'insurance': return { insurances: [activity?.insurance], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'job': return { jobs: [activity?.job], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'customer': return { customers: [activity?.customer], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'line item': return { lineitems: [activity?.lineitem], status: activity?.status, user: activity?.User?.firstName, created: activity?.createdAt };
        case 'view':
            const viewData = activity?.visitor?.views.find(p => p.pageId == activity?.pageId); // Use find for single result
            return { customer: activity?.customer?.name, url: viewData?.page?.url, title: viewData?.page?.title, created: activity?.createdAt };
        case 'click':
            const clickData = activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId); // Use find for single result
            if (clickData?.button === 'form') {
                 // Props for accordionForm
                return { customer: activity?.customer?.name, url: clickData.page?.url, title: clickData.page?.title, created: activity?.createdAt };
            } else {
                 // Props for accordionClick
                return { customer: activity?.customer?.name, url: clickData?.page?.url, title: clickData?.page?.title, button: clickData?.button, created: activity?.createdAt };
            }
        default: return {};
    }
}

</script>

<template>
  <div class="h-full overflow-y-scroll col-span-2 md:col-span-2 bg-slate-100 py-2 pl-2 shadow sm:rounded-md sm:overflow-hidden">
    <TabGroup :defaultIndex="0">
      <div class="h-full overflow-y-scroll pr-2">
        <TabList class="flex space-x-1 rounded-xl bg-slate-900 p-1 sticky top-0 z-10"> <!-- Added sticky positioning -->
            <Tab
              as="template"
              v-slot="{ selected }"
            >
            <span
              :class="[
                selected
                  ? 'bg-white shadow text-slate-900'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
              ]"
              class="w-full cursor-pointer text-center rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none">
              Activity
              </span>
            </Tab>

            <Tab
              as="template"
              v-slot="{ selected }"
            >
              <span
                :class="[
                  selected
                    ? 'bg-white shadow text-slate-900'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                ]"
                class="w-full cursor-pointer text-center rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none" >
                Whatsapp
              </span>
            </Tab>

            <Tab
              as="template"
              v-slot="{ selected }"
            >
              <span
                :class="[
                  selected
                    ? 'bg-white shadow text-slate-900'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white',
                ]"
                class="w-full cursor-pointer text-center rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none" >
                Notes
              </span>
            </Tab>
        </TabList>

        <TabPanels class="mt-2 ">
          <TabPanel>
            <ol class="relative border-l max-w-full ml-5 border-gray-200 dark:border-gray-700">
              <li v-for="activity in customer?.activities" :key="activity.uid" class="mb-10 ml-6">
                <!-- Simplified rendering using functions (still basic) -->
                 <!-- Special handling for click/form types -->
                 <template v-if="activity.type === 'click'">
                    <accordion-click v-if="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.button !== 'form'"
                        :customer="activity?.customer?.name"
                        :url="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.page?.url"
                        :title="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.page?.title"
                        :button="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.button"
                        :created="activity?.createdAt" />
                    <accordion-form v-else
                        :customer="activity?.customer?.name"
                        :url="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.page?.url"
                        :title="activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId)?.page?.title"
                        :created="activity?.createdAt" />
                 </template>
                 <!-- Generic handling for other types -->
                 <component v-else
                    :is="getActivityComponent(activity.type)"
                    v-bind="getActivityProps(activity)"
                 />
              </li>
            </ol>

          </TabPanel>
          <TabPanel>
            <ol class="relative border-l max-w-full ml-5 border-gray-200 dark:border-gray-700">
              <li class="mb-10 ml-6">
                 <!-- Ensure accordionWhatsapp is correctly imported and named -->
                <accordionWhatsapp v-if="customer?.whatsapp" :msgs="customer?.whatsapp" :key="wkey"></accordionWhatsapp>
              </li>
            </ol>
          </TabPanel>
          <TabPanel>
            <ol class="relative border-l max-w-full ml-5 border-gray-200 dark:border-gray-700">
              <li class="mb-10 ml-6">
                <accordion-notes v-if="customer?.notes" :notes="customer?.notes" :key="nkey" status="" user="" created=""></accordion-notes>
              </li>
            </ol>
          </TabPanel>
        </TabPanels>
      </div>
    </TabGroup>
  </div>
</template>

<style scoped>
/* Add component-specific styles if needed */
</style>