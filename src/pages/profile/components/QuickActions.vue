<script setup lang="ts">
const emit = defineEmits<{
  'open-settings': [];
  'navigate': [path: string];
}>();

const openSettings = () => {
  emit('open-settings');
};

const navigateTo = (path: string) => {
  emit('navigate', path);
};
</script>

<template>
  <div class="quick-actions">
    <div class="action-item" @click="openSettings">
      <div class="action-icon translation-icon">
        <i class="fas fa-language"></i>
      </div>
      <div class="action-name">同传设置</div>
    </div>
    
    <div class="action-item" @click="navigateTo('/membership')">
      <div class="action-icon membership-icon">
        <i class="fas fa-crown"></i>
      </div>
      <div class="action-name">升级套餐</div>
    </div>
    
    <div class="action-item" @click="navigateTo('/settings')">
      <div class="action-icon settings-icon">
        <i class="fas fa-cog"></i>
      </div>
      <div class="action-name">个人设置</div>
    </div>
  </div>
</template>

<style scoped>
/* 快捷功能 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.4s;
}

.action-item {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
  transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.4s ease;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.action-item:active {
  transform: translateY(4px) scale(0.96);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.action-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: inherit;
  filter: blur(8px);
  opacity: 0.5;
  z-index: -1;
  transition: opacity 0.4s ease;
}

.action-item:active .action-icon {
  transform: scale(0.9);
}

.action-item:active .action-icon::before {
  opacity: 0.7;
}

.translation-icon {
  background: linear-gradient(135deg, #93c5fd, #60a5fa);
  color: white;
}

.membership-icon {
  background: linear-gradient(135deg, #fcd34d, #fbbf24);
  color: white;
}

.settings-icon {
  background: linear-gradient(135deg, #a855f7, #8b5cf6);
  color: white;
}

.action-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
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

/* 适配小屏幕 */
@media (max-width: 370px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .action-item {
    flex-direction: row;
    justify-content: flex-start;
    padding: 16px;
  }
  
  .action-icon {
    margin-bottom: 0;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style> 