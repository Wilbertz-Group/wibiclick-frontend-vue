<script setup lang="ts">
import { onMounted, ref } from "vue";
import '@vueup/vue-quill/dist/vue-quill.bubble.css';
import 'quill-paste-smart';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
    required: false,
  },

  placeholder: {
    type: String,
    default: '',
    required: false,
  },

  contentType: {
    type: String,
    default: '',
    required: true,
  }
});

const emit = defineEmits(['update:modelValue']);

const defaultOptions = ref({
  theme: 'bubble',
  modules: {
    clipboard: {
      allowed: {
        tags: ['em', 'strong', 's', 'p', 'br', 'ul', 'ol', 'li', 'span'],
      },
      keepSelection: true,
    },
    toolbar: [
      ['bold', 'italic', 'strike'],
      ['blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  },
})

const handleChange = (value: any) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <div>
    <div class="editor">
      <QuillEditor
        :content="props.modelValue"
        :content-type="contentType"
        :options="defaultOptions"
        :placeholder="placeholder"
        @update:content="handleChange"
      />
    </div>
  </div>
</template>