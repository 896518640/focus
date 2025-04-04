<template>
  <van-cell
    :title="title"
    :value="value"
    :label="label"
    :size="size"
    :center="center"
    :is-link="isLink"
    :to="to"
    :url="url"
    :replace="replace"
    :clickable="clickable"
    :icon="icon"
    :arrow-direction="arrowDirection"
    :border="border"
    :title-style="titleStyle"
    :value-style="valueStyle"
    :title-class="titleClass"
    :value-class="valueClass"
    :class="[
      'custom-cell',
      {
        'custom-cell--highlight': highlight,
        'custom-cell--clickable': clickable || isLink,
        [`custom-cell--${theme}`]: theme,
        'custom-cell--no-padding': noPadding,
      },
      customClass
    ]"
    :style="customStyle"
    @click="$emit('click', $event)"
  >
    <template v-if="$slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    
    <template v-if="$slots.title" #title>
      <slot name="title"></slot>
    </template>
    
    <template v-if="$slots.label" #label>
      <slot name="label"></slot>
    </template>
    
    <template v-if="$slots.value" #default>
      <slot></slot>
    </template>
    
    <template v-if="$slots['right-icon']" #right-icon>
      <slot name="right-icon"></slot>
    </template>
    
    <template v-if="$slots.extra" #extra>
      <slot name="extra"></slot>
    </template>
  </van-cell>
</template>

<script lang="ts" setup>
import type { CellSize, CellArrowDirection } from 'vant';

defineEmits(['click']);

defineProps({
  // 基础属性 (从van-cell继承)
  title: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  size: { type: String as PropType<CellSize>, default: '' },
  center: { type: Boolean, default: false },
  isLink: { type: Boolean, default: false },
  to: { type: [String, Object], default: '' },
  url: { type: String, default: '' },
  replace: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  arrowDirection: { type: String as PropType<CellArrowDirection>, default: 'right' },
  border: { type: Boolean, default: true },
  titleStyle: { type: [String, Object], default: '' },
  valueStyle: { type: [String, Object], default: '' },
  titleClass: { type: [String, Object, Array], default: '' },
  valueClass: { type: [String, Object, Array], default: '' },
  
  // 扩展属性
  highlight: { type: Boolean, default: false }, // 是否高亮显示
  theme: { type: String, default: '' }, // 主题：primary, success, warning, danger
  customClass: { type: [String, Array, Object], default: '' }, // 自定义类名
  customStyle: { type: [String, Object], default: '' }, // 自定义样式
  noPadding: { type: Boolean, default: false }, // 是否移除内边距
});
</script>

<style lang="less" scoped>
.custom-cell {
  position: relative;
  transition: all 0.25s ease;
  
  &::after {
    position: absolute;
    box-sizing: border-box;
    content: ' ';
    pointer-events: none;
    right: 16px;
    bottom: 0;
    left: 16px;
    border-bottom: 1px solid var(--van-cell-border-color);
    transform: scaleY(0.5);
  }
  
  &:deep(.van-cell__title) {
    font-weight: 500;
  }

  &--clickable, &:deep(.van-cell--clickable) {
    &:active {
      background: var(--van-cell-active-color);
    }
  }
  
  // 高亮样式
  &--highlight {
    background: rgba(var(--van-primary-color), 0.05);
  }
  
  // 不同主题
  &--primary {
    &:deep(.van-cell__title) {
      color: var(--van-primary-color);
    }
  }
  
  &--success {
    &:deep(.van-cell__title) {
      color: var(--van-success-color);
    }
  }
  
  &--warning {
    &:deep(.van-cell__title) {
      color: var(--van-warning-color);
    }
  }
  
  &--danger {
    &:deep(.van-cell__title) {
      color: var(--van-danger-color);
    }
  }
  
  // 去除内边距
  &--no-padding {
    padding: 0;
  }
  
  // 增强图标样式
  &:deep(.van-cell__left-icon),
  &:deep(.van-cell__right-icon) {
    display: flex;
    align-items: center;
    font-size: 18px;
    height: 24px;
  }
  
  // 标题和值的样式优化
  &:deep(.van-cell__title) {
    letter-spacing: 0.2px;
    white-space: nowrap;
  }
  
  &:deep(.van-cell__value) {
    color: var(--van-text-color-2);
    font-weight: 500;
  }
  
  // 标签样式优化
  &:deep(.van-cell__label) {
    margin-top: 4px;
    color: var(--van-text-color-3);
    letter-spacing: 0.1px;
  }
}
</style> 