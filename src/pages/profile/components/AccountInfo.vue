<script setup lang="ts">
interface Props {
  formattedCreatedAt: string;
  joinDays: number;
}

defineProps<Props>();

const emit = defineEmits<{
  'navigate': [path: string];
}>();
const navigateToSetting = (path: string) => {
  emit('navigate', path);
};
</script>

<template>
  <div class="membership-info-card">
    <div class="membership-header">
      <i class="fas fa-shield-alt"></i>
      <span>账号信息</span>
    </div>
    <div class="membership-details">
      <div class="membership-row">
        <div class="info-label">加入时间</div>
        <div class="info-value">{{ formattedCreatedAt }}</div>
      </div>
      <div class="membership-row">
        <div class="info-label">已加入</div>
        <div class="info-value">{{ joinDays }} 天</div>
      </div>
      <div class="membership-row">
        <div class="info-label">账号状态</div>
        <div class="info-value active">活跃</div>
      </div>
    </div>
    <div class="membership-actions">
      <button class="membership-action-btn" @click="navigateToSetting('/settings/account')">
        <span>账号设置</span>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 会员信息卡片 */
.membership-info-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 22px;
  margin-bottom: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.6s;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.membership-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.membership-header i {
  font-size: 18px;
  color: #3b82f6;
}

.membership-details {
  margin-bottom: 18px;
}

.membership-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(100, 116, 139, 0.1);
}

.membership-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #64748b;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.info-value.active {
  color: #10b981;
}

.membership-actions {
  margin-top: 6px;
}

.membership-action-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #f1f5f9, #f8fafc);
  border: none;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background 0.3s ease;
}

.membership-action-btn:active {
  transform: scale(0.98);
  background: linear-gradient(45deg, #e2e8f0, #f1f5f9);
}

.membership-action-btn i {
  font-size: 12px;
  opacity: 0.5;
}

/* 动画 */
@keyframes card-slide-up {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 