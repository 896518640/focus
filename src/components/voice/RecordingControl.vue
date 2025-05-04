<template>
  <div class="control-section">
    <div class="record-button-wrapper">
      <van-button 
        round 
        size="large" 
        type="primary" 
        class="record-button" 
        :class="{ 'is-recording': isRecording }"
        @click="handleToggleRecording"
      >
        <span class="button-text">{{ isRecording ? '停止' : '按住说话' }}</span>
        <span class="button-icon" :class="{ 'is-recording': isRecording }"></span>
      </van-button>
    </div>

    <div class="controls">
      <enhanced-audio-wave 
        :mic="isRecording" 
        :color="waveColor"
        :height="waveHeight"
      ></enhanced-audio-wave>
    </div>

    <div class="service-info" v-if="currentServiceType">
      <van-tag type="primary" size="medium">
        当前服务: {{ getServiceLabel(currentServiceType) }}
      </van-tag>
      <van-tag type="success" size="medium" style="margin-left: 8px">
        语言: {{ getLanguageLabel(language) }}
      </van-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EnhancedAudioWave from '@/components/EnhancedAudioWave.vue';
import { SpeechServiceType } from '@/hooks/useSpeechRecognition';

// 定义组件属性
const props = defineProps({
  isRecording: {
    type: Boolean,
    required: true
  },
  currentServiceType: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  waveColor: {
    type: String,
    default: '#6366f1'
  },
  waveHeight: {
    type: String,
    default: '60px'
  }
});

// 定义组件事件
const emit = defineEmits(['toggle-recording']);

// 处理按钮点击，切换录音状态
const handleToggleRecording = () => {
  emit('toggle-recording');
};

// 获取服务类型显示标签
const getServiceLabel = (type: string): string => {
  return type === SpeechServiceType.RTASR ? '实时语音转写' : '语音听写';
};

// 获取语言显示标签
const getLanguageLabel = (lang: string): string => {
  const langMap: Record<string, string> = {
    'zh_cn': '中文（普通话）',
    'en_us': '英语（美国）',
    'ja_jp': '日语',
    'ko_kr': '韩语'
  };
  return langMap[lang] || lang;
};
</script>

<style lang="less" scoped>
.control-section {
  position: relative;
  z-index: 2;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 1s ease-out;
}

.record-button-wrapper {
  margin-bottom: 24px;
  width: 100%;
  display: flex;
  justify-content: center;
}

:deep(.record-button) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  border: none !important;
  padding: 18px 52px !important;
  font-weight: 600;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  min-width: 200px;

  &.is-recording {
    background: linear-gradient(135deg, #ef4444, #f97316) !important;
    animation: recording-pulse 2s infinite;
  }

  .van-button__text {
    color: white !important;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .button-icon {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ff4d4f;
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
    transform: scale(1);
    
    &.is-recording {
      animation: pulse 1.5s infinite;
    }
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(99, 102, 241, 0.5);
    
    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    transition: 0.5s;
  }
}

.controls {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.service-info {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}

@keyframes recording-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

@media (max-width: 480px) {
  :deep(.record-button) {
    padding: 16px 32px !important;
    width: 100%;
    max-width: 280px;
    
    .van-button__text {
      font-size: 16px;
    }
  }
}
</style> 