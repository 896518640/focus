<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  sourceLanguage: {
    type: String,
    default: 'cn'
  },
  targetLanguage: {
    type: String,
    default: 'en'
  },
  title: {
    type: String,
    default: '翻译设置'
  },
  showSourceLanguage: {
    type: Boolean,
    default: true
  },
  showTargetLanguage: {
    type: Boolean,
    default: true
  },
  showTranslationToggle: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'update:show', 
  'source-language-change', 
  'target-language-change'
]);

// 翻译开启的开关
const translationEnabled = ref(true);

// 当前选择的语言
const currentSourceLanguage = ref('');
const currentTargetLanguage = ref('');

// 保存设置的反馈状态
const isSaved = ref(false);

// 初始化时设置默认值和从localStorage读取保存的设置
onMounted(() => {
  // 首先使用prop值设置默认值
  currentSourceLanguage.value = String(props.sourceLanguage);
  currentTargetLanguage.value = String(props.targetLanguage);
  
  // 尝试从本地存储读取保存的设置
  try {
    const savedSettings = localStorage.getItem('translationSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      
      // 如果有保存的设置，更新当前值
      if (settings.sourceLanguage) {
        currentSourceLanguage.value = settings.sourceLanguage;
        emit('source-language-change', settings.sourceLanguage);
      }
      
      if (settings.targetLanguage) {
        currentTargetLanguage.value = settings.targetLanguage;
        emit('target-language-change', settings.targetLanguage);
      }
      
      if (settings.translationEnabled !== undefined) {
        translationEnabled.value = settings.translationEnabled;
      }
    }
  } catch (error) {
    console.error('读取设置失败:', error);
  }
});

// 监听props变化
watch(() => props.sourceLanguage, (newVal) => {
  currentSourceLanguage.value = String(newVal);
});

watch(() => props.targetLanguage, (newVal) => {
  currentTargetLanguage.value = String(newVal);
});

// 语言映射表
const languageMap: Record<string, string> = {
  cn: '普通话 (简体中文)',
  en: '英语',
  ja: '日语',
  ko: '韩语',
  de: '德语',
  fr: '法语',
  ru: '俄语',
  es: '西班牙语',
  it: '意大利语',
  pt: '葡萄牙语'
};

// 语言选项
const languageOptions = Object.entries(languageMap).map(([code, name]) => ({
  code,
  name
}));

// 关闭弹窗
const closePopup = () => {
  emit('update:show', false);
};

// 选择源语言
const selectSourceLanguage = (code: string) => {
  currentSourceLanguage.value = code;
  emit('source-language-change', code);
  
  // 添加触觉反馈 (如果设备支持)
  if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

// 选择目标语言
const selectTargetLanguage = (code: string) => {
  currentTargetLanguage.value = code;
  emit('target-language-change', code);
  
  // 添加触觉反馈 (如果设备支持)
  if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

// 切换翻译开关
const toggleTranslation = () => {
  translationEnabled.value = !translationEnabled.value;
  
  // 添加触觉反馈 (如果设备支持)
  if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

// 保存设置到本地存储
const saveSettings = () => {
  try {
    // 构建设置对象
    const settings = {
      sourceLanguage: currentSourceLanguage.value,
      targetLanguage: currentTargetLanguage.value,
      translationEnabled: translationEnabled.value
    };
    
    // 保存到localStorage
    localStorage.setItem('translationSettings', JSON.stringify(settings));
    
    // 显示保存成功状态
    isSaved.value = true;
    
    // 添加触觉反馈 (如果设备支持)
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
    
    // 2秒后隐藏保存成功状态
    setTimeout(() => {
      isSaved.value = false;
    }, 2000);
    
  } catch (error) {
    console.error('保存设置失败:', error);
  }
};
</script>

<template>
  <teleport to="body">
    <div class="settings-popup-overlay" v-if="show" @click="closePopup"></div>
    <div class="settings-popup" :class="{ 'show': show }">
      <div class="settings-header">
        <div class="settings-title">{{ title }}</div>
        <button class="close-btn" @click="closePopup">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="settings-content">
        <!-- 声音来源选项 -->
        <div v-if="showSourceLanguage" class="source-language-section">
          <div class="section-title">声音来源</div>
          <div class="language-options">
            <button 
              v-for="option in languageOptions" 
              :key="option.code"
              class="language-option"
              :class="{ 'active': currentSourceLanguage === option.code }"
              @click="selectSourceLanguage(option.code)"
            >
              {{ option.name }}
            </button>
          </div>
        </div>
        
        <div v-if="showSourceLanguage && (showTargetLanguage || showTranslationToggle)" class="settings-divider"></div>
        
        <!-- 目标语言选项 -->
        <div v-if="showTargetLanguage" class="target-language-section">
          <div class="section-title">目标语言</div>
          <div class="language-options">
            <button 
              v-for="option in languageOptions" 
              :key="option.code"
              class="language-option"
              :class="{ 
                'active': currentTargetLanguage === option.code,
                'disabled': option.code === currentSourceLanguage
              }"
              @click="selectTargetLanguage(option.code)"
              :disabled="option.code === currentSourceLanguage"
            >
              {{ option.name }}
            </button>
          </div>
        </div>
        
        <div v-if="showTargetLanguage && showTranslationToggle" class="settings-divider"></div>
        
        <!-- 翻译开关 -->
        <div v-if="showTranslationToggle" class="switch-section">
          <div class="switch-label">开启翻译</div>
          <div class="toggle-switch" :class="{ 'active': translationEnabled }" @click="toggleTranslation">
            <div class="toggle-button"></div>
          </div>
        </div>
        
        <div class="settings-divider"></div>
        
        <!-- 底部信息和保存按钮 -->
        <div class="settings-footer">
          <div class="settings-info">
            <i class="fas fa-info-circle"></i>
            <span>选择正确的声音来源语言可以提高翻译质量</span>
          </div>
          <button class="remember-btn" @click="saveSettings" :class="{ 'saved': isSaved }">
            {{ isSaved ? '设置已保存' : '记住设置' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* 弹窗背景遮罩 */
.settings-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
  animation: fadeIn 0.2s ease;
}

/* 设置弹窗 */
.settings-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  z-index: 9999;
  background-color: #F2F2F7;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  padding-bottom: 16px;
  width: 90%;
  max-width: 360px;
  max-height: 80vh;
  overflow-y: auto;
  opacity: 0;
  visibility: hidden;
  transition: transform 0.3s, opacity 0.3s, visibility 0.3s;
}

.settings-popup.show {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, -50%) scale(1);
}

/* 设置标题区域 */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.settings-title {
  font-size: 18px;
  font-weight: 500;
  color: #000;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #8E8E93;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover, .close-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 设置内容区域 */
.settings-content {
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 12px;
}

/* 语言选择区域 */
.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.language-option {
  padding: 8px 12px;
  border-radius: 10px;
  background-color: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 14px;
  color: #000;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  position: relative;
}

.language-option.active {
  background-color: #007AFF;
  color: white;
  border-color: #007AFF;
  transform: scale(1.03);
  box-shadow: 0 2px 5px rgba(0, 122, 255, 0.2);
}

.language-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 开关区域 */
.switch-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.switch-label {
  font-size: 15px;
  color: #000;
  display: flex;
  align-items: center;
}

.toggle-switch {
  width: 50px;
  height: 28px;
  background-color: #E5E5EA;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-switch.active {
  background-color: #34C759;
}

.toggle-button {
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-button {
  transform: translateX(22px);
}

/* 分割线 */
.settings-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.05);
  margin: 16px 0;
}

/* 底部区域 */
.settings-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8E8E93;
  max-width: 65%;
}

.settings-info i {
  margin-right: 5px;
}

.remember-btn {
  padding: 6px 12px;
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.remember-btn:hover {
  background-color: #0069D9;
}

.remember-btn.saved {
  background-color: #34C759;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自定义滚动条 */
.settings-popup::-webkit-scrollbar {
  width: 6px;
}

.settings-popup::-webkit-scrollbar-track {
  background: transparent;
}

.settings-popup::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.settings-popup::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .settings-popup {
    background-color: #1C1C1E;
  }
  
  .settings-title {
    color: #FFFFFF;
  }
  
 .section-title {
    color: #8E8E93;
  }
  
  .language-option {
    background-color: #2C2C2E;
    border-color: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
  }
  
  .switch-label {
    color: #FFFFFF;
  }
  
  .toggle-switch {
    background-color: #3A3A3C;
  }
  
  .settings-divider {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style> 