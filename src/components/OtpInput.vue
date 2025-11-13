<template>
  <div
    class="flex items-center justify-center gap-2"
    role="group"
    :aria-disabled="disabled ? 'true' : 'false'"
  >
    <input
      v-for="(digit, index) in values"
      :key="index"
      :ref="(el) => setInputRef(el, index)"
      :value="digit"
      :name="`${name}-${index}`"
      :aria-label="`Digit ${index + 1}`"
      :disabled="disabled"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :inputmode="inputMode"
      :type="inputType"
      pattern="[0-9]*"
      maxlength="1"
      class="w-12 h-14 border border-slate-300 rounded-lg bg-white text-center text-2xl font-semibold tracking-widest text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-150"
      :class="inputClass"
      @input="handleInput(index, $event)"
      @keydown="handleKeydown(index, $event)"
      @paste="handlePaste(index, $event)"
      @focus="handleFocus(index, $event)"
      @blur="handleBlur(index, $event)"
    />
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ''
  },
  length: {
    type: Number,
    default: 6,
    validator: (value) => Number.isInteger(value) && value > 0 && value <= 12
  },
  disabled: {
    type: Boolean,
    default: false
  },
  autoFocus: {
    type: Boolean,
    default: true
  },
  inputClass: {
    type: String,
    default: ''
  },
  allowPaste: {
    type: Boolean,
    default: true
  },
  inputType: {
    type: String,
    default: 'text'
  },
  inputMode: {
    type: String,
    default: 'numeric'
  },
  name: {
    type: String,
    default: 'otp'
  },
  selectOnFocus: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'change', 'complete', 'focus', 'blur']);

const inputRefs = ref([]);
const values = ref(createValueArray(props.modelValue, props.length));
const wasComplete = ref(values.value.join('').length === props.length);

watch(
  () => props.modelValue,
  (newVal) => {
    const next = createValueArray(newVal, props.length);
    if (!arraysEqual(next, values.value)) {
      values.value = next;
    }
    wasComplete.value = next.join('').length === props.length;
  },
  { immediate: true }
);

watch(
  () => props.length,
  (newLength, oldLength) => {
    if (newLength === oldLength) return;
    const joined = values.value.join('');
    const next = createValueArray(joined, newLength);
    values.value = next;
    inputRefs.value = inputRefs.value.slice(0, newLength);
    const normalized = next.join('');
    emit('update:modelValue', normalized);
    emit('change', { value: normalized, reason: 'length-change' });
    wasComplete.value = normalized.length === newLength;
  }
);

onMounted(() => {
  if (props.disabled || !props.autoFocus) {
    return;
  }
  nextTick(() => {
    const firstEmpty = values.value.findIndex((digit) => digit === '');
    const targetIndex = firstEmpty === -1 ? props.length - 1 : firstEmpty;
    focusInput(targetIndex);
  });
});

function setInputRef(el, index) {
  if (el) {
    inputRefs.value[index] = el;
  }
}

function sanitizeInput(value) {
  return (value ?? '').toString().replace(/\D/g, '');
}

function createValueArray(value, length) {
  const digits = sanitizeInput(Array.isArray(value) ? value.join('') : value);
  const next = Array.from({ length }, () => '');
  for (let i = 0; i < length && i < digits.length; i += 1) {
    next[i] = digits[i];
  }
  return next;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function focusInput(index) {
  if (index < 0 || index >= props.length) return;
  const el = inputRefs.value[index];
  if (!el) return;
  el.focus({ preventScroll: true });
  if (props.selectOnFocus) {
    el.select();
  }
}

function focusNext(index) {
  const nextIndex = Math.min(props.length - 1, index + 1);
  focusInput(nextIndex);
}

function focusPrev(index) {
  const prevIndex = Math.max(0, index - 1);
  focusInput(prevIndex);
}

function updateModel(reason) {
  const value = values.value.join('');
  emit('update:modelValue', value);
  emit('change', { value, reason });
  const isComplete = value.length === props.length;
  if (isComplete && !wasComplete.value) {
    emit('complete', value);
  }
  wasComplete.value = isComplete;
}

function handleInput(index, event) {
  if (props.disabled) return;
  const input = event.target;
  const sanitized = sanitizeInput(input.value);

  if (!sanitized) {
    values.value[index] = '';
    input.value = '';
    updateModel('clear');
    return;
  }

  input.value = sanitized[0];
  fillDigits(index, sanitized.split(''));
}

function fillDigits(startIndex, digits) {
  let cursor = startIndex;
  digits.forEach((digit) => {
    if (cursor >= props.length) return;
    values.value[cursor] = digit;
    cursor += 1;
  });
  updateModel('input');
  nextTick(() => {
    if (cursor >= props.length) {
      inputRefs.value[props.length - 1]?.blur();
    } else {
      focusInput(cursor);
    }
  });
}

function handleKeydown(index, event) {
  if (props.disabled) return;
  const { key } = event;

  if (key === 'Backspace') {
    event.preventDefault();
    if (values.value[index]) {
      values.value[index] = '';
      updateModel('delete');
      nextTick(() => focusInput(index));
    } else {
      const prevIndex = Math.max(0, index - 1);
      if (values.value[prevIndex]) {
        values.value[prevIndex] = '';
        updateModel('delete');
      }
      nextTick(() => focusInput(prevIndex));
    }
    return;
  }

  if (key === 'Delete') {
    event.preventDefault();
    if (values.value[index]) {
      values.value[index] = '';
      updateModel('delete');
    }
    return;
  }

  if (key === 'ArrowLeft') {
    event.preventDefault();
    focusPrev(index);
    return;
  }

  if (key === 'ArrowRight') {
    event.preventDefault();
    focusNext(index);
    return;
  }

  if (key === 'Enter') {
    const value = values.value.join('');
    if (value.length === props.length) {
      emit('complete', value);
    }
  }
}

function handlePaste(index, event) {
  if (!props.allowPaste) {
    event.preventDefault();
    return;
  }

  const pasted = event.clipboardData?.getData('text') ?? '';
  const sanitized = sanitizeInput(pasted);
  if (!sanitized) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  fillDigits(index, sanitized.split(''));
}

function handleFocus(index, event) {
  emit('focus', { index, event });
  if (props.selectOnFocus) {
    event.target.select();
  }
}

function handleBlur(index, event) {
  emit('blur', { index, event });
}
</script>
