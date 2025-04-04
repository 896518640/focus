<script setup lang="ts">
// 登录页面背景组件
</script>

<template>
  <div class="login-background">
    <div class="background-shape"></div>
    <div class="background-shape-2"></div>
  </div>
</template>

<style scoped>
.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.background-shape {
  position: absolute;
  top: -150px;
  right: -150px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.3), rgba(88, 86, 214, 0.3));
  z-index: 0;
  animation: float 8s ease-in-out infinite;
}

.background-shape-2 {
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.2), rgba(255, 45, 85, 0.2));
  z-index: 0;
  animation: float 6s ease-in-out infinite reverse;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(15px, 15px) rotate(5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
</style>
