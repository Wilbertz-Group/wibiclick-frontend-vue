<script setup>
	import { ref } from 'vue'
	import {
		TransitionRoot,
		TransitionChild,
		Dialog,
		DialogPanel,
		DialogTitle,
	} from '@headlessui/vue'

	const props = defineProps(['heading', 'body', 'isOpen'])

</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle
                as="h3"
                class="text-lg text-center font-medium leading-6 text-slate-900"
              >
                {{ heading }}
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-center text-slate-900" v-html="body">
                </p>
              </div>
							<div class="mt-4 flex">
                <button
                  type="button"
                  class="m-auto text-center inline-flex justify-center rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
									@click="$emit('closeModal')"
                >
                  Got it, thanks!
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>


