<script setup lang="ts">
defineEmits(['logout']);
</script>

<template>
  <div class="logout-container">
    <button class="logout-btn" @click="$emit('logout')">
      <i class="fas fa-sign-out-alt"></i>
      <span>退出登录</span>
    </button>
  </div>
</template>

<style scoped>
/* 退出登录 */
.logout-container {
  margin-top: 12px;
  transform: translateY(30px);
  opacity: 0;
  animation: card-slide-up 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 0.8s;
}

.logout-btn {
  width: 100%;
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(45deg, rgba(239, 68, 68, 0.05), rgba(248, 113, 113, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), background 0.3s ease;
}

.logout-btn:active {
  transform: scale(0.98);
  background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), rgba(248, 113, 113, 0.1));
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