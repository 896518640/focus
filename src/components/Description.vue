<script setup lang="ts">
interface Props {
  text?: string;
  subtext?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: "Focus",
  subtext: "智能语音实时转写助手"
});
</script>

<template>
  <div class="brand-container">
    <div class="logo-wrapper">
      <img src="/logo.png" class="logo-image" alt="Focus Logo">
      <div class="logo-glow"></div>
    </div>
    
    <div class="brand-text">
      <h1 class="brand-name">{{ props.text }}</h1>
      <p class="brand-slogan">{{ props.subtext }}</p>
    </div>
  </div>
</template>

<style lang="less" scoped>
.brand-container {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 12px;
  padding: 14px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(74, 132, 239, 0.1), rgba(94, 107, 247, 0.1));
  box-shadow: 0 4px 12px rgba(74, 132, 239, 0.08);
  border: 1px solid rgba(74, 132, 239, 0.12);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(74, 132, 239, 0.15);
    
    .logo-glow {
      opacity: 0.8;
      transform: scale(1.1);
    }
  }
}

.logo-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .logo-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 2;
    filter: drop-shadow(0 2px 4px rgba(74, 132, 239, 0.2));
    animation: gentle-float 3s infinite ease-in-out;
  }
  
  .logo-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #4a84ef, #5e6bf7);
    border-radius: 50%;
    filter: blur(8px);
    opacity: 0.5;
    z-index: 1;
    transition: all 0.5s ease;
    animation: pulse-glow 4s infinite alternate ease-in-out;
  }
}

.brand-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  
  .brand-name {
    font-size: 26px;
    font-weight: 600;
    margin: 0;
    line-height: 1.2;
    background: linear-gradient(to right, #4a84ef, #5e6bf7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .brand-slogan {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
    opacity: 0.9;
    font-weight: 500;
  }
}

@keyframes gentle-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.08);
  }
}

/* 响应式调整 */
@media (max-width: 480px) {
  .brand-container {
    padding: 12px 16px;
  }
  
  .logo-wrapper {
    width: 42px;
    height: 42px;
    margin-right: 14px;
  }
  
  .brand-text {
    .brand-name {
      font-size: 22px;
    }
    
    .brand-slogan {
      font-size: 13px;
    }
  }
}
</style>
