<template>
  <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <component :is="icon" class="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {{ title }}
            </dt>
            <dd>
              <div class="text-lg font-medium text-gray-900 dark:text-white">
                {{ typeof value === 'number' ? value.toFixed(0) : value }}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div class="bg-gray-50 dark:bg-gray-700 px-5 py-3">
      <div class="text-sm">
        <span
          :class="[
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            'font-medium'
          ]"
        >
          {{ trend === 'up' ? '↑' : '↓' }} {{ Math.abs(percentage).toFixed(2) }}%
        </span>
        <span class="text-gray-500 dark:text-gray-400">vs last period</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CurrencyDollarIcon, UsersIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    default: 'CurrencyDollarIcon'
  },
  trend: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down'].includes(value)
  },
  percentage: {
    type: Number,
    required: true
  }
});

const iconComponents = {
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
};
</script>