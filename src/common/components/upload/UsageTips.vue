<script setup lang="ts">
// 使用提示组件
// 无需任何特殊逻辑
</script>

<template>
  <div class="upload-tips">
    <div class="tips-title">
      <i class="fas fa-lightbulb"></i> 使用提示
    </div>
    <div class="tips-content">
      <ul>
        <li>上传的音频文件将被转换为文本</li>
        <li>转换后的文本可以进行翻译和摘要生成</li>
        <li>支持批量上传多个文件</li>
        <li>处理时间取决于文件大小和长度</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.upload-tips {
  background-color: var(--background-light, #FFFFFF);
  border-radius: var(--border-radius-md, 14px);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  animation: fadeIn 0.5s ease 0.4s backwards;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.upload-tips:active {
  transform: scale(0.99);
  box-shadow: var(--box-shadow-xs, 0 1px 4px rgba(0, 0, 0, 0.05));
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: var(--primary-color, #007AFF);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-content {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
}

.tips-content ul {
  padding-left: 20px;
}

.tips-content li {
  margin-bottom: 8px;
  position: relative;
}

.tips-content li::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary-color, #007AFF);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
