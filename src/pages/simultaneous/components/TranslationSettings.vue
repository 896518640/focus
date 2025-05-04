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
  }
});

const emit = defineEmits(['update:show', 'source-language-change', 'target-language-change']);

// 翻译开启的开关
const translationEnabled = ref(true);

// 当前选择的语言，使用string字符串类型
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
  ru: '俄语'
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
  <div class="settings-popup-overlay" v-if="show" @click="closePopup"></div>
  <div class="settings-popup" :class="{ 'show': show }">
    <div class="settings-header">
      <div class="settings-title">翻译设置</div>
      <button class="close-btn" @click="closePopup">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="settings-content">
      <div class="source-language-section">
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
      
      <div class="settings-divider"></div>
      
      <div class="target-language-section">
        <div class="section-title">目标语言</div>
        <div class="language-options">
          <button 
            v-for="option in languageOptions" 
            :key="option.code"
            class="language-option"
            :class="{ 'active': currentTargetLanguage === option.code }"
            @click="selectTargetLanguage(option.code)"
          >
            {{ option.name }}
          </button>
        </div>
      </div>
      
      <div class="settings-divider"></div>
      
      <div class="switch-section">
        <div class="switch-label">开启翻译</div>
        <div class="toggle-switch" :class="{ 'active': translationEnabled }" @click="toggleTranslation">
          <div class="toggle-button"></div>
        </div>
      </div>
      
      <div class="settings-divider"></div>
      
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
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

/* 设置弹窗 */
.settings-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.9);
  z-index: 1001;
  background-color: #F2F2F7;
  border-radius: 16px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  padding-bottom: 16px;
  max-height: 80vh;
  width: 90%;
  max-width: 400px;
  overflow-y: auto;
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  pointer-events: none;
}

.settings-popup.show {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.settings-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #F2F2F7;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 16px;
}

.settings-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.close-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8E8E93;
  font-size: 17px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.close-btn:active {
  background-color: rgba(142, 142, 147, 0.1);
}

.settings-content {
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 12px;
}

.settings-divider {
  height: 0.5px;
  background-color: rgba(0, 0, 0, 0.1);
  margin: 24px 0;
}

.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.language-option {
  background-color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 15px;
  color: #000000;
  transition: all 0.2s ease;
  cursor: pointer;
}

.language-option:active {
  transform: scale(0.96);
  opacity: 0.8;
}

.language-option.active {
  background-color: #007AFF;
  color: #FFFFFF;
  font-weight: 500;
}

.switch-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-label {
  font-size: 17px;
  color: #000000;
}

.toggle-switch {
  width: 51px;
  height: 31px;
  background-color: rgba(120, 120, 128, 0.16);
  border-radius: 31px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-switch.active {
  background-color: #34C759;
}

.toggle-button {
  width: 27px;
  height: 27px;
  background-color: #FFFFFF;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-button {
  transform: translateX(20px);
}

.settings-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8E8E93;
  font-size: 13px;
}

.settings-info i {
  font-size: 15px;
  color: #007AFF;
}

.remember-btn {
  width: 100%;
  background-color: #007AFF;
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 500;
  border: none;
  border-radius: 12px;
  padding: 12px 0;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.3s ease;
}

.remember-btn:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.remember-btn.saved {
  background-color: #34C759;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 适配小屏幕 */
@media (max-width: 375px) {
  .language-option {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  .switch-label {
    font-size: 16px;
  }
  
  .settings-info {
    font-size: 12px;
  }
  
  .remember-btn {
    font-size: 16px;
    padding: 10px 0;
  }
}
</style> 