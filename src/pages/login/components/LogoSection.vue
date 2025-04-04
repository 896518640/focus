<script setup lang="ts">
defineProps({
  animate: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div class="logo-container" :class="{ 'animate-in': animate }">
    <div class="logo floating">
      <i class="fas fa-bullseye"></i>
    </div>
    <div class="app-name">Focus</div>
    <div class="app-slogan">高效学习，智能助手</div>
  </div>
</template>

<style scoped>
.logo-container {
  text-align: center;
  margin: 20px 0 40px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.logo-container.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.logo {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  color: white;
  font-size: 32px;
  box-shadow: 0 10px 20px rgba(0, 122, 255, 0.3);
}

.floating {
  animation: floating 3s ease-in-out infinite;
}

@keyframes floating {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.app-name {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
  color: var(--text-color, #1c1c1e);
}

.app-slogan {
  font-size: 14px;
  color: var(--text-secondary, #8e8e93);
}
</style>
