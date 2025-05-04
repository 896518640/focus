<script setup lang="ts">
defineProps({
  showTips: {
    type: Boolean,
    default: false
  }
});

defineEmits(['close']);
</script>

<template>
  <div class="usage-tips animate__animated" :class="{ 'show-tips': showTips }">
    <div class="tips-header">
      <div class="tips-title">使用提示</div>
      <button class="close-tips" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="tips-content">
      <div class="tip-item">
        <i class="fas fa-microphone-alt"></i>
        <span>点击麦克风按钮开始/停止录音</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-language"></i>
        <span>翻译结果会实时显示在卡片中</span>
      </div>
      <div class="tip-item">
        <i class="fas fa-save"></i>
        <span>点击保存按钮可保存翻译结果</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-tips {
  background-color: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-top: 16px;
  position: absolute;
  top: 60px;
  left: 15px;
  right: 15px;
  z-index: 100;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.usage-tips.show-tips {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.close-tips {
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 14px;
  cursor: pointer;
}

.tips-content {
  padding: 14px 18px;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #4A4A4A;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item i {
  color: #4169E1;
  width: 24px;
  margin-right: 12px;
}
</style> 