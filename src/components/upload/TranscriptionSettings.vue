<script setup lang="ts">
/**
 * 转录设置组件
 * 用于设置音频语言、翻译和发言人
 */
import { ref } from 'vue';
import { vibrate } from '@/utils/fileUtils';
import { TranscriptionSettings as TranscriptionSettingsOptions } from '@/hooks/useAudioTranscription';

// 初始化语言选项
const languages = [
  { id: 'cn', name: '中文', active: true },
  { id: 'en', name: '英语', active: false },
  { id: 'jp', name: '日语', active: false },
  { id: 'yue', name: '粤语', active: false },
  { id: 'fspk', name: '中英文自由说', active: false }
];

// 翻译选项
const translationOptions = [
  { id: 'none', name: '不翻译' },
  { id: 'en', name: '英语' },
  { id: 'cn', name: '中文' },
  { id: 'ja', name: '日语' }
];

// 发言人选项
const speakerOptions = [
  { id: 1, name: '单人演讲' },
  { id: 2, name: '2人对话' },
  { id: 0, name: '多人讨论' },
  { id: -1, name: '不区分' }
];

// 当前选择的语言
const selectedLanguage = ref('cn');
// 当前选择的翻译
const selectedTranslation = ref('none');
// 当前选择的发言人
const selectedSpeaker = ref(-1);

// 选择语言
const selectLanguage = (id: string) => {
  selectedLanguage.value = id;
  vibrate(5);
  // 触发事件
  emit('update:settings', getSettings());
};

// 更新翻译选项
const updateTranslation = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (target) {
    selectedTranslation.value = target.value;
    vibrate(5);
    emit('update:settings', getSettings());
  }
};

// 更新发言人选项
const updateSpeaker = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (target) {
    selectedSpeaker.value = Number(target.value);
    vibrate(5);
    emit('update:settings', getSettings());
  }
};

// 获取当前设置
const getSettings = (): TranscriptionSettingsOptions => {
  // 创建基本设置对象
  const settings: TranscriptionSettingsOptions = {
    input: {
      sourceLanguage: selectedLanguage.value
    },
    parameters: {
      transcription: {
        diarizationEnabled: selectedSpeaker.value !== -1
      },
      translationEnabled: selectedTranslation.value !== 'none'
    },
    type: 'offline'
  };
  
  // 只有当启用说话人分离时，才添加 diarization 属性
  if (selectedSpeaker.value !== -1 && settings.parameters?.transcription) {
    // 使用类型断言
    (settings.parameters.transcription as any).diarization = {
      speakerCount: selectedSpeaker.value
    };
  }
  
  // 只有当启用翻译时，才添加 translation 属性
  if (selectedTranslation.value !== 'none' && settings.parameters) {
    // 使用类型断言
    (settings.parameters as any).translation = {
      targetLanguages: [selectedTranslation.value]
    };
  }
  
  return settings;
};

// 组件事件
const emit = defineEmits(['update:settings']);

// 向父组件暴露方法
defineExpose({
  getSettings
});
</script>

<template>
  <div class="transcription-settings">
    <!-- 语言选择 -->
    <div class="settings-section">
      <div class="section-title">
        选择音视频语言
        <i class="fas fa-question-circle help-icon"></i>
      </div>
      <div class="language-options">
        <button 
          v-for="lang in languages" 
          :key="lang.id"
          class="language-button"
          :class="{ active: selectedLanguage === lang.id }"
          @click="selectLanguage(lang.id)"
        >
          {{ lang.name }}
        </button>
      </div>
    </div>

    <!-- 翻译设置 -->
    <div class="settings-section">
      <div class="section-title">翻译</div>
      <div class="select-container">
        <select 
          v-model="selectedTranslation" 
          class="settings-select"
          @change="updateTranslation($event)"
        >
          <option 
            v-for="option in translationOptions" 
            :key="option.id" 
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
        <i class="fas fa-chevron-down select-arrow"></i>
      </div>
    </div>

    <!-- 发言人设置 -->
    <div class="settings-section">
      <div class="section-title">选择发言人</div>
      <div class="select-container">
        <select 
          v-model="selectedSpeaker" 
          class="settings-select"
          @change="updateSpeaker($event)"
        >
          <option 
            v-for="option in speakerOptions" 
            :key="option.id" 
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
        <i class="fas fa-chevron-down select-arrow"></i>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transcription-settings {
  margin-bottom: 16px;
}

.settings-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.help-icon {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
  margin-left: 6px;
}

.language-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 5px;
}

.language-button {
  background-color: var(--background-secondary, #F2F2F7);
  color: var(--text-primary, #000000);
  border: none;
  border-radius: 15px;
  padding: 10px 20px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  text-align: center;
}

.language-button.active {
  background-color: var(--background-tertiary, #E5E5EA);
  color: var(--primary-color, #007AFF);
  font-weight: 500;
}

.language-button:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.select-container {
  position: relative;
}

.settings-select {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid var(--border-color, #D1D1D6);
  border-radius: 10px;
  background-color: var(--background-light, #FFFFFF);
  color: var(--text-primary, #000000);
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #8E8E93);
  pointer-events: none;
}

@media (max-width: 375px) {
  .language-button {
    padding: 8px 16px;
    font-size: 14px;
    min-width: 70px;
  }
  
  .section-title {
    font-size: 15px;
  }
  
  .settings-select {
    padding: 10px 14px;
    font-size: 14px;
  }
}
</style>
