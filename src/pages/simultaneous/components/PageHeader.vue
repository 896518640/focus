<script setup lang="ts">
const emit = defineEmits(['goBack', 'source-language-change', 'target-language-change']);
defineProps({
  sourceLanguage: {
    type: String,
    default: 'zh'
  },
  targetLanguage: {
    type: String,
    default: 'en'
  }
});

// 语言映射表
const languageMap: Record<string, string> = {
  zh: '普通话 (简体中文)',
  en: '英语',
  ja: '日语',
  ko: '韩语'
};

// 获取语言显示名称
const getLanguageName = (code: string): string => {
  return languageMap[code] || code;
};

// 处理语言选择事件
const handleSourceLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('source-language-change', target.value);
};

const handleTargetLanguageChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('target-language-change', target.value);
};
</script>

<template>
  <div class="header">
    <div class="header-logo">
      <button class="back-button" @click="$emit('goBack')">
        <i class="fas fa-chevron-left"></i>
      </button> 
      <!-- <div class="logo-icon">
        <i class="fas fa-bullseye"></i>
      </div> -->
      <div class="logo-text">focus</div>
      <div class="language-selector">
        <select 
          class="language-select"
          :value="sourceLanguage"
          @change="handleSourceLanguageChange"
        >
          <option value="zh">普通话 (简体中文)</option>
          <option value="en">英语</option>
          <option value="ja">日语</option>
          <option value="ko">韩语</option>
        </select>
        <span class="arrow">→</span>
        <select 
          class="language-select"
          :value="targetLanguage"
          @change="handleTargetLanguageChange"
        >
          <option value="zh">普通话 (简体中文)</option>
          <option value="en">英语</option>
          <option value="ja">日语</option>
          <option value="ko">韩语</option>
        </select>
      </div>
    </div>
    <div class="header-status">
      <div class="signal-indicator">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #FFFFFF;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 20px;
  color: #4169E1;
  margin-right: 10px;
}

.logo-text {
  font-size: 12px;
  font-weight: 600;
  color: #000000;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  white-space: nowrap;
  font-family: 'Poppins', sans-serif;
}

.signal-indicator {
  display: flex;
}

.signal-indicator .bar {
  background-color: #4CD964;
  width: 3px;
  height: 15px;
  display: inline-block;
  margin-right: 2px;
  animation: pulse 1.5s infinite alternate;
}

.signal-indicator .bar:nth-child(1) {
  animation-delay: 0s;
}

.signal-indicator .bar:nth-child(2) {
  animation-delay: 0.3s;
}

.signal-indicator .bar:nth-child(3) {
  animation-delay: 0.6s;
}

.back-button {
  color: #4169E1;
  font-size: 18px;
  background: none;
  border: none;
  margin-right: 10px;
  cursor: pointer;
  border-radius: 50%;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.back-button:active {
  background-color: rgba(65, 105, 225, 0.1);
  transform: scale(0.95);
}

.language-selector {
  display: flex;
  align-items: center;
  margin-left: 10px;
  font-size: 12px;
}

.arrow {
  margin: 0 5px;
  color: #8E8E93;
}

.language-select {
  background-color: transparent;
  border: none;
  color: #4169E1;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.language-select:hover {
  background-color: rgba(65, 105, 225, 0.1);
}

.language-select:focus {
  outline: none;
  background-color: rgba(65, 105, 225, 0.2);
}

@media (max-width: 380px) {
  .language-selector {
    font-size: 10px;
  }
  
  .language-select {
    font-size: 10px;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
}
</style> 