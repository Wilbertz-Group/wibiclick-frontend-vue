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

// Map activity types to their corresponding components
const activityComponentMap = {
  whatsapp: accordionWhatsapp,
  payment: accordionPayment,
  email: accordionEmail,
  note: accordionNotes,
  invoice: accordionInvoice,
  estimate: accordionEstimate,
  insurance: accordionInsurance,
  job: accordionJob,
  customer: accordionCustomer,
  'line item': accordionLineitem,
  view: accordionView,
  // Special handler for 'click' type to differentiate between click and form submission
  click: (activity) => {
    const clickData = activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId);
    return clickData?.button === 'form' ? accordionForm : accordionClick;
  }
};

// Function to resolve the component based on the activity type
function getActivityComponent(activity) {
  const componentOrResolver = activityComponentMap[activity.type];
  if (typeof componentOrResolver === 'function') {
    // If it's a function (like for 'click'), execute it to get the component
    return componentOrResolver(activity);
  }
  // Otherwise, return the component directly or null if not found
  return componentOrResolver || null;
}

// Function to get the appropriate props for the resolved component
function getActivityProps(activity) {
    // Determine the specific component being rendered (especially for 'click' type)
    const component = getActivityComponent(activity);

    // Base props common to many accordion types (adjust as needed)
    const baseProps = {
        status: activity?.status,
        user: activity?.User?.firstName,
        created: activity?.createdAt
    };

    // Component-specific props
    switch (component) {
        case accordionWhatsapp: return { msgs: [activity?.whatsapp] }; // Assuming msgs is always an array
        case accordionPayment: return { ...baseProps, payments: [activity?.payment] };
        case accordionEmail: return { msgs: [activity?.email] }; // Assuming msgs is always an array
        case accordionNotes: return { ...baseProps, notes: [activity?.notes] };
        case accordionInvoice: return { ...baseProps, invoices: [activity?.invoice] };
        case accordionEstimate: return { ...baseProps, estimates: [activity?.estimate] };
        case accordionInsurance: return { ...baseProps, insurances: [activity?.insurance] };
        case accordionJob: return { ...baseProps, jobs: [activity?.job] };
        case accordionCustomer: return { ...baseProps, customers: [activity?.customer] };
        case accordionLineitem: return { ...baseProps, lineitems: [activity?.lineitem] };
        case accordionView:
            const viewData = activity?.visitor?.views.find(p => p.pageId == activity?.pageId);
            return { customer: activity?.customer?.name, url: viewData?.page?.url, title: viewData?.page?.title, created: activity?.createdAt };
        case accordionClick:
             const clickDataForClick = activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId);
            return { customer: activity?.customer?.name, url: clickDataForClick?.page?.url, title: clickDataForClick?.page?.title, button: clickDataForClick?.button, created: activity?.createdAt };
        case accordionForm:
            const clickDataForForm = activity?.visitor?.clicks.find(p => p.pageId == activity?.pageId);
            return { customer: activity?.customer?.name, url: clickDataForForm?.page?.url, title: clickDataForForm?.page?.title, created: activity?.createdAt };
        default: return {}; // Return empty object for unknown components
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
                 <!-- Use dynamic component with resolved component and props -->
                 <component
                    :is="getActivityComponent(activity)"
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