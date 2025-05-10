<script setup lang="ts">
interface Props {
  membership: {
    used_minutes: number;
    total_minutes: number;
    remaining_minutes: number;
  };
  usedMinutesPercentage: number;
  formattedNextResetTime: string;
}

defineProps<Props>();
</script>

<template>
  <div class="membership-usage-info">
    <div class="usage-header">
      <span>会员使用情况</span>
      <span class="usage-text">已使用 {{ membership.used_minutes }}/{{ membership.total_minutes }}分钟</span>
    </div>
    <div class="usage-progress-container">
      <div class="usage-progress-bar">
        <div class="usage-progress-fill" :style="{ width: `${usedMinutesPercentage}%` }"></div>
      </div>
      <div class="usage-info">
        <div class="reset-info">
          <i class="fas fa-sync-alt"></i>
          <span>下次重置: {{ formattedNextResetTime }}</span>
        </div>
        <div class="remaining-info">
          <i class="fas fa-clock"></i>
          <span>剩余: {{ membership.remaining_minutes }} 分钟</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 会员使用情况 */
.membership-usage-info {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(100, 116, 139, 0.1);
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.usage-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.usage-progress-container {
  margin-bottom: 5px;
}

.usage-progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.usage-progress-fill {
  height: 100%;
  background: linear-gradient(to right, #60a5fa, #3b82f6);
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}

.reset-info, .remaining-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reset-info i, .remaining-info i {
  font-size: 10px;
  opacity: 0.7;
}
</style> 