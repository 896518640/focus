<template>
  <div class="feature-card" @click="$emit('click')">
    <div class="feature-icon" :class="`icon-${type}`">
      <i :class="icon"></i>
    </div>
    <div class="feature-content">
      <div class="feature-title">{{ title }}</div>
      <div class="feature-description">{{ description }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  type: {
    type: String,
    required: true,
    validator: (val: string) => ['recognition', 'upload', 'translate', 'summary'].includes(val)
  },
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})

defineEmits(['click'])
</script>

<style lang="less" scoped>
.feature-card {
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  .feature-icon {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md);
    font-size: 24px;
    color: white;
    
    &.icon-recognition {
      background-color: var(--accent-color);
    }
    
    &.icon-upload {
      background-color: var(--primary-color);
    }
    
    &.icon-translate {
      background-color: var(--success-color);
    }
    
    &.icon-summary {
      background-color: var(--warning-color);
    }
  }
  
  .feature-content {
    width: 100%;
  }
  
  .feature-title {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-xs);
  }
  
  .feature-description {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }
}
</style>
