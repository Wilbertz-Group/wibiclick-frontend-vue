<!-- wibiclick-frontend-vue/src/components/editor/TipTapEditor.vue -->
<template>
  <div class="tiptap-editor border rounded bg-gray-100 dark:bg-gray-900">
    <div v-if="editor" class="toolbar p-2 border-b bg-gray-100 dark:bg-gray-900 flex space-x-2">
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :disabled="!editor.can().chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Bold
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :disabled="!editor.can().chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Italic
      </button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()" :disabled="!editor.can().chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Strike
      </button>
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Blockquote
      </button>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Bullet List
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" class="px-2 py-1 border rounded hover:bg-gray-200">
        Ordered List
      </button>
       <button type="button" @click="editor.chain().focus().unsetAllMarks().run()" class="px-2 py-1 border rounded hover:bg-gray-200">
        Clear Marks
      </button>
      <button type="button" @click="editor.chain().focus().clearNodes().run()" class="px-2 py-1 border rounded hover:bg-gray-200">
        Clear Nodes
      </button>
    </div>
    <editor-content :editor="editor" class="p-4 min-h-[150px]" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      // Configure StarterKit options here if needed
      // e.g., disable heading levels: heading: { levels: [1, 2, 3] }
    }),
    // Placeholder extension could be added here if needed
    // Placeholder.configure({ placeholder: props.placeholder })
  ],
  onUpdate: () => {
    // HTML
    emit('update:modelValue', editor.value?.getHTML() || '');

    // JSON
    // emit('update:modelValue', editor.value.getJSON())
  },
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (value) => {
  // HTML
  const isSame = (editor.value?.getHTML() || '') === value;

  // JSON
  // const isSame = JSON.stringify(editor.value.getJSON()) === JSON.stringify(value)

  if (isSame) {
    return;
  }

  editor.value?.commands.setContent(value || '', false);
});

// Destroy the editor instance when the component is unmounted
onBeforeUnmount(() => {
  editor.value?.destroy();
});

</script>

<style>
.tiptap-editor .ProseMirror {
  outline: none;
}

.tiptap-editor .toolbar button.is-active {
  background-color: #d1d5db; /* bg-gray-300 */
}

/* Add any other custom styles for TipTap here */
</style>