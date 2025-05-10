<script setup lang="ts">
interface Props {
  usage: {
    transcribeMinutesUsed: number;
    translateMinutesUsed: number;
    translationCount: number;
  };
  statsLoaded: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="stats-container">
    <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
      <div class="stats-value">{{ usage.transcribeMinutesUsed }}<span class="stats-unit">m</span></div>
      <div class="stats-label">识别用时</div>
    </div>
    <div class="stats-divider"></div>
    <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
      <div class="stats-value">{{ usage.translateMinutesUsed }}<span class="stats-unit">m</span></div>
      <div class="stats-label">翻译用时</div>
    </div>
    <div class="stats-divider"></div>
    <div class="stats-item" :class="{ 'stats-loaded': statsLoaded }">
      <div class="stats-value">{{ usage.translationCount }}</div>
      <div class="stats-label">翻译次数</div>
    </div>
  </div>
</template>

<style scoped>
/* 使用统计 */
.stats-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(45deg, #f1f5f9, #f8fafc);
  border-radius: 18px;
  padding: 16px;
}

.stats-item {
  flex: 1;
  text-align: center;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}

.stats-item.stats-loaded {
  opacity: 1;
  transform: translateY(0);
}

.stats-item:nth-child(1) { transition-delay: 0.6s; }
.stats-item:nth-child(3) { transition-delay: 0.7s; }
.stats-item:nth-child(5) { transition-delay: 0.8s; }

.stats-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(100, 116, 139, 0.2);
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 5px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.stats-unit {
  font-size: 14px;
  font-weight: 500;
  margin-left: 2px;
  color: #64748b;
}

.stats-label {
  font-size: 13px;
  color: #64748b;
}
</style> 