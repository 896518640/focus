<template>
  <div class="filter-container">
    <div 
      v-for="option in filterOptions" 
      :key="option.value"
      class="filter-option"
      :class="{ active: modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      <span class="filter-text">{{ option.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface FilterOption {
  text: string;
  value: string;
}

defineProps({
  filterOptions: {
    type: Array as () => FilterOption[],
    required: true
  },
  modelValue: {
    type: String,
    required: true
  }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.filter-container {
  display: flex;
  overflow-x: auto;
  padding: 10px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.filter-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.filter-option {
  padding: 6px 16px;
  margin-right: 10px;
  border-radius: 16px;
  background-color: #F5F5F5;
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
}

.filter-option.active {
  background-color: #007AFF;
  color: #FFFFFF;
}

.filter-text {
  display: block;
}
</style> 