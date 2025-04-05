<template>
  <div class="transcription-page">
    <van-nav-bar
      title="音频转写"
      left-arrow
      @click-left="router.back()"
    />
    
    <div class="page-content">
      <div class="intro-section">
        <h2>阿里通义听悟语音转写</h2>
        <p>上传音频文件，快速获取高质量的文字转写结果。支持中文、英文等多种语言。</p>
      </div>
      
      <van-tabs v-model:active="activeTab" animated swipeable>
        <van-tab title="文件转写">
          <audio-transcription />
        </van-tab>
        <van-tab title="实时转写">
          <div class="coming-soon">
            <van-empty description="实时转写功能即将上线" />
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AudioTranscription from '@/common/components/voice/AudioTranscription.vue';

const router = useRouter();
const activeTab = ref(0);
</script>

<style scoped>
.transcription-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.page-content {
  padding: 16px;
}

.intro-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(100, 101, 102, 0.08);
}

.intro-section h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.intro-section p {
  margin: 0;
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
}

.coming-soon {
  padding: 40px 0;
}

:deep(.van-tabs__content) {
  background-color: transparent;
}

:deep(.van-tab__pane) {
  padding-top: 16px;
}
</style>
