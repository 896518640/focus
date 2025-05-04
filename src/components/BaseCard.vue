<template>
  <div class="base-card" :class="[shadow && `shadow-${shadow}`, round && 'is-round']">
    <div v-if="$slots.header || title" class="base-card__header">
      <slot name="header">{{ title }}</slot>
    </div>
    <div class="base-card__body" :style="bodyStyle">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  shadow: {
    type: String,
    default: '',
    validator: (val: string) => ['', 'sm', 'md', 'lg'].includes(val)
  },
  round: {
    type: Boolean,
    default: true
  },
  bodyStyle: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style lang="less" scoped>
.base-card {
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  
  &.is-round {
    border-radius: var(--border-radius-md);
  }
  
  &.shadow-sm {
    box-shadow: var(--shadow-sm);
  }
  
  &.shadow-md {
    box-shadow: var(--shadow-md);
  }
  
  &.shadow-lg {
    box-shadow: var(--shadow-lg);
  }
  
  &__header {
    padding: var(--spacing-md);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    border-bottom: 1px solid var(--border-color);
  }
  
  &__body {
    padding: var(--spacing-md);
  }
  
  &__footer {
    padding: var(--spacing-md);
    border-top: 1px solid var(--border-color);
  }
}
</style>
