<template>
  <div class="translation-selector">
    <div class="language-tabs">
      <van-tabs v-model:active="activeTab" animated>
        <van-tab title="翻译设置">
          <div class="option-group">
            <div class="option-label">目标语言</div>
            <van-radio-group 
              v-model="targetLanguageModel" 
              direction="horizontal" 
              class="language-radio-group"
            >
              <van-radio 
                v-for="lang in supportedLanguages" 
                :key="lang.code" 
                :name="lang.code" 
                icon-size="18px"
              >
                {{ lang.label }}
              </van-radio>
            </van-radio-group>
          </div>
          
          <div class="option-group">
            <div class="option-label">翻译设置</div>
            <van-cell-group inset>
              <van-cell center title="自动翻译">
                <template #right-icon>
                  <van-switch v-model="autoTranslateModel" size="24px" />
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </van-tab>
        
        <van-tab title="TTS设置">
          <div class="option-group">
            <div class="option-label">朗读速度</div>
            <van-slider 
              v-model="speechRateModel" 
              :min="0.5" 
              :max="2" 
              :step="0.1" 
              :format-tooltip="(value: number) => `${value}x`"
            />
          </div>
          
          <div class="option-group">
            <div class="option-label">朗读设置</div>
            <van-cell-group inset>
              <van-cell center title="自动朗读翻译">
                <template #right-icon>
                  <van-switch v-model="autoSpeakModel" size="24px" />
                </template>
              </van-cell>
            </van-cell-group>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { supportedLanguages } from '@/composables/useTranslationService';

// 定义组件属性
const props = defineProps<{
  targetLanguage: string;
  autoTranslate: boolean;
  autoSpeak: boolean;
  speechRate: number;
}>();

// 定义组件事件
const emit = defineEmits([
  'update:targetLanguage',
  'update:autoTranslate',
  'update:autoSpeak',
  'update:speechRate'
]);

// 当前活动选项卡
const activeTab = ref(0);

// 使用计算属性创建双向绑定模型
const targetLanguageModel = computed({
  get: () => props.targetLanguage,
  set: (value: string) => emit('update:targetLanguage', value)
});

const autoTranslateModel = computed({
  get: () => props.autoTranslate,
  set: (value: boolean) => emit('update:autoTranslate', value)
});

const autoSpeakModel = computed({
  get: () => props.autoSpeak,
  set: (value: boolean) => emit('update:autoSpeak', value)
});

const speechRateModel = computed({
  get: () => props.speechRate,
  set: (value: number) => emit('update:speechRate', value)
});
</script>

<style lang="less" scoped>
.translation-selector {
  position: relative;
  z-index: 2;
  margin-bottom: 24px;
  
  :deep(.van-tabs__wrap) {
    background: transparent;
  }
  
  :deep(.van-tabs__nav) {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px;
  }
  
  :deep(.van-tab) {
    color: #4b5563;
    border-radius: 8px;
    
    &.van-tab--active {
      color: var(--van-primary-color);
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  :deep(.van-tabs__line) {
    display: none;
  }
  
  :deep(.van-tabs__content) {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    margin-top: 12px;
  }
}

.option-group {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.option-label {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 8px;
}

.language-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  :deep(.van-radio) {
    margin-right: 0;
    margin-bottom: 10px;
    
    .van-radio__label {
      color: #4b5563;
      font-size: 14px;
    }
    
    .van-radio__icon {
      background-color: transparent;
    }
    
    &.van-radio--checked {
      .van-radio__label {
        color: var(--van-primary-color);
        font-weight: 500;
      }
    }
  }
}

:deep(.van-cell-group--inset) {
  background: rgba(255, 255, 255, 0.2);
  margin: 0;
}

:deep(.van-cell) {
  background: transparent;
  
  &::after {
    border-color: rgba(255, 255, 255, 0.1);
  }
}

:deep(.van-slider) {
  margin: 0 8px;
}

@media (max-width: 480px) {  
  .language-radio-group {
    flex-direction: column;
    
    :deep(.van-radio) {
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style> 