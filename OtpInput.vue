<template>
  <div class="flex flex-col gap-2">
    <div
      :class="['relative']"
      tabindex="-1"
      @mousedown="handleMouseDown"
      @focusin="isFocused = true"
      @focusout="handleWrapperFocusOut"
    >
      <label
        :for="`${inputId}-0`"
        :class="[
          'absolute left-4 z-1 inline-flex items-center gap-1 text-[#7B7B7B] capitalize transform -translate-y-[50%] transition-all duration-200 pointer-events-none',
          { 'top-[20%] text-xs': isActive, 'top-[50%] text-base': !isActive },
        ]"
      >
        {{ label }}
      </label>

      <div
        :class="[
          'flex w-full lg:min-h-14 items-center gap-3 border rounded-lg px-4 transition-all duration-200 py-3 pb-2.5',
          bgColor,
          error ? 'border-rose-500' : 'border-[#B59B5A]',
        ]"
      >
        <slot name="left" />

        <div class="flex flex-1 items-center justify-between gap-2 sm:gap-3">
          <input
            v-for="index in otpLength"
            :key="index"
            :id="`${inputId}-${index - 1}`"
            ref="setInputRef"
            :value="digits[index - 1]"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="\d*"
            maxlength="1"
            :data-index="index - 1"
            class="h-11 w-10 sm:w-12 sm:h-12 rounded-md border border-transparent bg-white text-center text-lg font-semibold text-black outline-none ring-2 ring-transparent transition focus:ring-[#B59B5A] disabled:opacity-50"
            @input="(event) => handleInput(event, index - 1)"
            @keydown="(event) => handleKeydown(event, index - 1)"
            @focus="(event) => handleFocus(event, index - 1)"
            @paste="handlePaste"
            v-bind="otpInputAttrs"
          />
        </div>

        <slot name="right">
          <img
            v-if="rightSvg"
            :src="rightSvg"
            class="w-6 h-6 cursor-pointer"
            @click="$emit('icon-click')"
          />
        </slot>
      </div>
    </div>

    <span v-if="error" class="text-red-500 text-[12px]">{{ error }}</span>
  </div>
</template>

<script setup>
import { computed, ref, useAttrs, onMounted, watch, nextTick } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  id: { type: String, default: () => `otp-input-${Math.random().toString(36).slice(2, 8)}` },
  label: String,
  rightSvg: String,
  bgColor: { type: String, default: "bg-[#FFF]" },
  error: String,
  modelValue: { type: [String, Number], default: "" },
  otpLength: { type: Number, default: 6 },
});

const emit = defineEmits(["update:modelValue", "icon-click", "complete"]);

const attrs = useAttrs();
const inputRefs = ref([]);
const isFocused = ref(false);
const activeIndex = ref(0);

const normalizedValue = computed(() => String(props.modelValue ?? ""));
const digits = computed(() => {
  const value = normalizedValue.value.replace(/\D/g, "");
  return Array.from({ length: props.otpLength }, (_, index) => value[index] ?? "");
});
const hasValue = computed(() => digits.value.some(Boolean));

const inputId = computed(() => props.id);
const otpInputAttrs = computed(() => ({
  ...attrs,
  "aria-invalid": props.error ? "true" : undefined,
}));
const isActive = computed(() => isFocused.value || hasValue.value);

const setInputRef = (el) => {
  if (!el) return;
  const index = Number(el.dataset.index);
  if (!Number.isNaN(index)) {
    inputRefs.value[index] = el;
  }
};

const focusInput = (index) => {
  const next = inputRefs.value[index];
  if (next) {
    next.focus();
    requestAnimationFrame(() => next.select());
    activeIndex.value = index;
  }
};

const emitValue = (values) => {
  const nextValue = values.join("");
  emit("update:modelValue", nextValue);
  if (values.every((digit) => digit !== "")) {
    emit("complete", nextValue);
  }
};

const updateDigit = (index, char) => {
  const sanitized = char.replace(/\D/g, "");
  const values = digits.value.slice();
  values[index] = sanitized[0] ?? "";
  emitValue(values);
};

const handleMouseDown = (event) => {
  if (event.target === event.currentTarget) {
    event.preventDefault();
    const firstEmpty = digits.value.findIndex((digit) => digit === "");
    const targetIndex = firstEmpty === -1 ? props.otpLength - 1 : firstEmpty;
    focusInput(targetIndex);
  }
};

const handleWrapperFocusOut = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isFocused.value = false;
  }
};

const handleInput = (event, index) => {
  const { value } = event.target;
  const sanitized = value.replace(/\D/g, "");

  if (sanitized.length === 0) {
    updateDigit(index, "");
    return;
  }

  const values = digits.value.slice();
  let nextIndex = index;

  sanitized.split("").forEach((char) => {
    if (nextIndex < props.otpLength) {
      values[nextIndex] = char;
      nextIndex += 1;
    }
  });

  emitValue(values);

  if (nextIndex < props.otpLength) {
    focusInput(nextIndex);
  } else {
    inputRefs.value[index]?.blur();
  }
};

const handleKeydown = (event, index) => {
  if (event.key === "Backspace") {
    event.preventDefault();
    if (digits.value[index]) {
      updateDigit(index, "");
      focusInput(index);
    } else if (index > 0) {
      updateDigit(index - 1, "");
      focusInput(index - 1);
    }
    return;
  }

  if (event.key === "ArrowLeft" && index > 0) {
    event.preventDefault();
    focusInput(index - 1);
  } else if (event.key === "ArrowRight" && index < props.otpLength - 1) {
    event.preventDefault();
    focusInput(index + 1);
  }
};

const handleFocus = (event, index) => {
  isFocused.value = true;
  activeIndex.value = index;
  if (digits.value[index]) {
    event.target.select();
  }
};

const handlePaste = (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData("text").replace(/\D/g, "");

  if (!text) return;

  const start = Number(event.target.dataset.index) || activeIndex.value || 0;
  const values = digits.value.slice();
  let index = start;

  text.split("").forEach((char) => {
    if (index < props.otpLength) {
      values[index] = char;
      index += 1;
    }
  });

  emitValue(values);

  const nextIndex = Math.min(index, props.otpLength - 1);
  focusInput(nextIndex);
};

watch(
  () => props.modelValue,
  () => nextTick(() => {
    const currentLength = normalizedValue.value.length;
    if (currentLength >= props.otpLength) {
      inputRefs.value[currentLength - 1]?.blur();
    }
  })
);

onMounted(() => {
  requestAnimationFrame(() => {
    const firstEmpty = digits.value.findIndex((digit) => digit === "");
    if (firstEmpty === -1) {
      inputRefs.value[props.otpLength - 1]?.blur();
    }
  });
});
</script>
