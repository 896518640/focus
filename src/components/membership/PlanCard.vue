<script setup lang="ts">
import { MembershipPlan } from '@/types/membership';

// 组件属性
const props = defineProps<{
  plan: MembershipPlan;
  selected?: boolean;
}>();

// 组件事件
const emit = defineEmits<{
  (event: 'select', planId: string): void;
}>();

/**
 * 选择套餐
 */
const handleSelect = () => {
  emit('select', props.plan.id);
};
</script>

<template>
  <div class="plan-card" :class="{ 'plan-selected': selected }" @click="handleSelect">
    <div class="plan-header">
      <div class="plan-title">{{ plan.description }}</div>
      <div class="plan-sub-title">
        <span class="plan-refund" v-if="plan.refundable">不满意可退款</span>
        <span class="plan-cycle">({{ plan.name }})</span>
        <span>{{ plan.cycleText }}/{{ plan.priceUnit }}{{ plan.price }}</span>
      </div>
    </div>
    
    <div class="plan-price">
      <span class="price-tag">{{ plan.priceUnit }}</span>
      <span class="price-value">{{ plan.price }}</span>
    </div>
  </div>
</template>

<style scoped>
.plan-card {
  margin: 10px 0;
  padding: 16px;
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.plan-selected {
  background-color: #F5F9FF;
  border: 1px solid #3B82F6;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.1);
}

.plan-header {
  flex: 1;
}

.plan-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.plan-sub-title {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.plan-refund {
  color: #666;
}

.plan-cycle {
  color: #666;
}

.plan-price {
  display: flex;
  align-items: baseline;
  font-weight: bold;
  color: #333;
}

.price-tag {
  font-size: 16px;
  margin-right: 2px;
}

.price-value {
  font-size: 22px;
}
</style> 