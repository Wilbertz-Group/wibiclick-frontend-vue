<script setup>
	import { onMounted, ref, watchEffect } from "vue";
  import {
		TransitionRoot,
		TransitionChild,
		Dialog,
		DialogPanel,
		DialogTitle,
	} from '@headlessui/vue'
  import axios from 'axios';
  import { useToast } from "vue-toast-notification";

	const props = defineProps(['file', 'isOpen', 'client', 'phone', 'sender', 'company', 'blob', 'website', 'name', 'invoiceNumber', 'totalAmount', 'dueDate'])
  const emit = defineEmits(['closeModal'])
  const isOpen = ref(false);
  const message = ref('');
  const toast = useToast();

  const tone = ref('neutral');
  const tones = ['neutral', 'friendly', 'formal', 'casual'];

  async function changeTone() {
    const response = await axios.post('https://api.openai.com/v4/your-endpoint', {
      input: message.value,
      tone: tone.value,
    });

    message.value = response.data.output;
  }

  async function accept() {    
    await sendBlob(props.blob)
    isOpen.value = false;
    emit('closeModal', 'closeModal')    
  }

  function cancel() {
    isOpen.value = false;
    emit('closeModal', 'closeModal')
  }

  async function sendBlob(blob) {
    if (!blob) return;
    try {
      toast.success(`processing the document to whatsapp....`)
      const to = props.phone + '@s.whatsapp.net';
      const formData = new FormData();

      formData.append('id', to); 
      formData.append('filename', props.name);
      formData.append('file', blob, props.name+'.pdf');

      //Send the message
      await axios.post(`send-whatsapp?id=${props.website}`, { to, message: message.value });

      //Send the document
      await axios.post(`send-whatsapp-document?id=${props.website}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`Attachment and message have been sent successfully`)

    } catch (error) {
      // Removed console.error
    }
  }

  onMounted(() => {
    isOpen.value = props.isOpen;
    message.value = `Dear ${props.client},

Attached is Invoice #${props.invoiceNumber}, totaling R${props.totalAmount}, due on ${props.dueDate}. Please review and submit payment via EFT.

If you have any questions, feel free to contact us. Thank you for your business.

Best regards,
${props.sender}`
  });

</script>

<template>
  <div>
    <TransitionRoot appear :show="isOpen" as="div">
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
                class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
              >
                <div class="">
                  <DialogTitle
                    as="h3"
                    class="text-lg text-left font-medium leading-6 text-slate-900 pb-0 mb-0"
                  >
                    Whatsapp message to send with attachement
                  </DialogTitle>

                  <div class="mt-4">
                    <textarea v-model="message" style="height: 240px;" class="w-full p-2 border rounded"></textarea>
                  </div>

                  <!-- <div class="mt-4">
                    <label for="tone" class="block text-sm font-medium text-gray-700">Tone:</label>
                    <select v-model="tone" id="tone" class="w-full mt-1 p-2 border rounded">
                      <option v-for="t in tones" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div> -->

                  <div class="mt-4 flex justify-end space-x-4">
                    <button @click="cancel" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100">
                      Cancel
                    </button>
                    <button @click="accept" class="px-4 py-2 text-sm font-medium text-white rounded-md border border-transparent bg-slate-900">
                      Send to Whatsapp
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>

    </TransitionRoot>
  </div>
</template>



