<template>
  <transition name="slide-fade">
    <div v-if="visible" class="search-bar">
      <div class="search-icon">
        <i class="fas fa-search"></i>
      </div>
      <input 
        ref="searchInput"
        class="search-input" 
        type="text" 
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" 
        placeholder="搜索历史记录..." 
      />
      <transition name="fade">
        <button v-if="modelValue" class="search-clear" @click="clearSearch">
          <i class="fas fa-times-circle"></i>
        </button>
      </transition>
      <button class="search-cancel" @click="$emit('close')">
        取消
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'clear', 'close']);
const searchInput = ref<HTMLInputElement | null>(null);

// 清空搜索
const clearSearch = () => {
  emit('update:modelValue', '');
  emit('clear');
};

// 当搜索框显示时，自动聚焦输入框
watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      searchInput.value?.focus();
    }, 100);
  }
});
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-icon {
  color: #8E8E93;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background-color: #F5F5F5;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 15px;
  color: #000000;
  outline: none;
}

.search-input::placeholder {
  color: #8E8E93;
}

.search-clear {
  background: none;
  border: none;
  color: #8E8E93;
  padding: 0 8px;
  font-size: 16px;
  cursor: pointer;
}

.search-cancel {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 15px;
  padding: 0 0 0 12px;
  cursor: pointer;
  white-space: nowrap;
}

/* 过渡动画 */
.slide-fade-enter-active, 
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from, 
.slide-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
}
</style> 