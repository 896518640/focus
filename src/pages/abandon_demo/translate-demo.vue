<template>
  <div class="translation-demo">
    <div class="header">
      <h2>实时翻译演示</h2>
      <p>通过阿里云通义听悟API实现的实时语音识别与翻译</p>
    </div>
    
    <div class="demo-container">
      <RealtimeTranslator />
    </div>
    
    <div class="info-section">
      <h3>关于实时翻译</h3>
      <p>此实时翻译功能使用阿里云通义听悟API，可以实现以下功能：</p>
      <ul>
        <li>实时语音识别（中文、英文、日语、韩语等）</li>
        <li>跨语言实时翻译</li>
        <li>多语种间互译</li>
        <li>实时显示识别和翻译结果</li>
      </ul>
      
      <h3>使用说明</h3>
      <ol>
        <li>选择源语言（您要说的语言）</li>
        <li>选择目标语言（要翻译成的语言）</li>
        <li>点击"开始录音"按钮</li>
        <li>对着麦克风说话，结果会实时显示</li>
        <li>完成后点击"停止录音"按钮</li>
      </ol>
      
      <div class="note">
        <strong>注意：</strong> 首次使用时，浏览器会请求麦克风访问权限，请允许访问以使用该功能。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RealtimeTranslator from '@/components/RealtimeTranslator.vue';
</script>

<style scoped>
.translation-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
}

.demo-container {
  margin-bottom: 40px;
}

.info-section {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 24px;
}

.info-section h3 {
  color: #4169E1;
  margin-top: 0;
  margin-bottom: 16px;
}

.info-section p {
  margin-bottom: 16px;
  line-height: 1.5;
}

.info-section ul, .info-section ol {
  margin-bottom: 20px;
  line-height: 1.6;
}

.info-section li {
  margin-bottom: 8px;
}

.note {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 16px;
  border-radius: 4px;
  margin-top: 20px;
}
</style> 