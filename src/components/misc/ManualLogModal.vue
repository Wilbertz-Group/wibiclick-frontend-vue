// wibiclick-frontend-vue/src/components/misc/ManualLogModal.vue
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                {{ title || 'Log Manual Interaction' }}
              </DialogTitle>
              <div class="mt-4 space-y-4">
                 <p v-if="suggestionContext" class="text-sm text-gray-600 dark:text-gray-400 border-l-4 border-gray-300 pl-3 italic">
                    Context: "{{ suggestionContext }}"
                 </p>

                 <div>
                    <label for="manual-log-feedback" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes / Feedback: <span class="text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                        id="manual-log-feedback"
                        v-model="feedback"
                        rows="4"
                        class="form-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        placeholder="Enter details about the manual interaction, outcome, or any feedback..."
                    ></textarea>
                 </div>

              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" class="btn-secondary-modern" @click="closeModal">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn-primary-modern"
                  @click="confirmLog"
                >
                  Confirm Log Entry
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, watch } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue';

const props = defineProps({
  isOpen: Boolean,
  suggestionContext: { // Pass the original suggestion message/title for context
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'Log Manual Interaction',
  }
});

const emit = defineEmits(['update:isOpen', 'confirm-log']);

const feedback = ref('');

// Clear feedback when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    feedback.value = '';
  }
});

function closeModal() {
  emit('update:isOpen', false);
}

function confirmLog() {
  // Emit the feedback (even if empty)
  emit('confirm-log', feedback.value);
  closeModal();
}

</script>