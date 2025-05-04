<template>
  <div class="service-selector">
    <van-tabs v-model:active="activeTab" animated>
      <van-tab title="服务设置">
        <div class="option-group">
          <div class="option-label">识别服务</div>
          <van-radio-group v-model="serviceTypeModel" direction="horizontal" class="service-radio-group">
            <van-radio :name="ServiceType.RTASR" icon-size="18px">科大讯飞实时语音转写</van-radio>
            <van-radio :name="ServiceType.IFLYTEK_STT" icon-size="18px">科大讯飞语音听写</van-radio>
          </van-radio-group>
        </div>
      </van-tab>
      <van-tab title="语言设置">
        <div class="option-group">
          <div class="option-label">识别语言</div>
          <van-radio-group v-model="languageModel" direction="horizontal" class="language-radio-group">
            <van-radio name="zh_cn" icon-size="18px">中文（普通话）</van-radio>
            <van-radio name="en_us" icon-size="18px">英语（美国）</van-radio>
          </van-radio-group>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { SpeechServiceType } from '@/hooks/useSpeechRecognition';

// 定义组件属性
const props = defineProps<{
  serviceType: SpeechServiceType;
  language: string;
}>();

// 定义组件事件
const emit = defineEmits([
  'update:serviceType',
  'update:language'
]);

// 别名，使代码更易读
const ServiceType = SpeechServiceType;

// 当前活动选项卡
const activeTab = ref(0);

// 使用计算属性创建双向绑定模型
const serviceTypeModel = computed({
  get: () => props.serviceType,
  set: (value: SpeechServiceType) => emit('update:serviceType', value)
});

const languageModel = computed({
  get: () => props.language,
  set: (value: string) => emit('update:language', value)
});
</script>

<style lang="less" scoped>
.service-selector {
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
  margin-bottom: 12px;
  
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

.service-radio-group,
.language-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  
  :deep(.van-radio) {
    margin-right: 0;
    
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

@media (max-width: 480px) {  
  .service-radio-group,
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