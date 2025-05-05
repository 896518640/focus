<template>
  <div class="ai-summary-page" :class="{ 'page-leave-active': isPageLeaving }">
    <!-- 顶部标题栏 -->
    <div class="header animate__animated animate__fadeInDown page-element">
      <button class="back-button" @click="goBack">
        <i class="fas fa-chevron-left"></i>
      </button>
      <div class="header-title">AI总结</div>
      <button v-if="idDev" class="reset-button" @click="handleResetAll">
        <i class="fas fa-undo"></i>
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading && !summaryContent" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在生成总结...</div>
    </div>
    
    <!-- 内容区 -->
    <div v-if="!isLoading || summaryContent" class="summary-container animate__animated animate__fadeIn">
      <!-- 左上角角标，显示翻译记录的标题 -->
      <div class="summary-badge" v-if="translationData.title">
        <i class="fas fa-file-alt"></i>
        <span>{{ translationData.title }}</span>
      </div>
      
      <!-- 总结内容卡片 -->
      <div class="summary-card">
        <div class="card-header">
          <div class="card-title">
            <i class="fas fa-robot"></i>
            <span>AI总结</span>
          </div>
          
          <!-- 错误重试按钮 -->
          <div v-if="error" class="retry-button" @click="getSummary">
            <i class="fas fa-redo-alt"></i>
            <span>重试</span>
          </div>
        </div>
        
        <!-- 错误状态 -->
        <div v-if="error" class="error-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>{{ error }}</p>
        </div>
        
        <!-- 内容状态 -->
        <div v-else class="summary-content" :class="{ 'stream-active': loading && !isStreamComplete }">
          <p class="summary-text" :class="{ 'placeholder-text': !displayedContent && !loading }">
            <span v-if="displayedContent">{{ displayedContent }}</span>
            <span class="cursor" v-if="loading && !isStreamComplete"></span>
            <span v-else-if="!displayedContent && !loading">准备生成总结...</span>
          </p>
          
          <!-- 跳过动画按钮 -->
          <div v-if="loading && displayedContent && !isStreamComplete" class="skip-animation-wrapper">
            <button class="skip-animation-button" @click="showFullText">
              <i class="fas fa-forward"></i>
              <span>显示全文</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- 原文卡片 -->
      <div class="original-card" v-if="translationData.originalText">
        <div class="card-header">
          <div class="card-title">
            <i class="fas fa-file-alt"></i>
            <span>原文内容</span>
          </div>
        </div>
        <div class="original-content">
          <p>{{ translationData.originalText }}</p>
        </div>
      </div>
      
      <!-- 译文卡片 -->
      <div class="translated-card" v-if="translationData.translatedText">
        <div class="card-header">
          <div class="card-title">
            <i class="fas fa-language"></i>
            <span>译文内容</span>
          </div>
        </div>
        <div class="translated-content">
          <p>{{ translationData.translatedText }}</p>
        </div>
      </div>
    </div>
    
    <!-- 底部操作区 -->
    <div class="bottom-actions animate__animated animate__fadeInUp page-element" v-if="!isLoading || summaryContent">
      <button class="action-button" @click="copySummary">
        <i class="fas fa-copy"></i>
        <span>复制摘要</span>
      </button>
      
      <!-- 重新生成/停止按钮 -->
      <div 
        class="action-button primary-button" 
        @click="handleActionButtonClick"
        style="user-select: none;"
      >
        <i :class="['fas', loading && !isStreamComplete ? 'fa-stop' : 'fa-sync-alt']"></i>
        <span>{{ loading && !isStreamComplete ? '停止生成' : '重新生成' }}</span>
      </div>
      
      <button class="action-button" @click="copyAll">
        <i class="fas fa-copy"></i>
        <span>复制全文</span>
      </button>
      
      <!-- 测试模式按钮 - 仅开发环境 -->
      <button v-if="idDev" class="action-button mock-button" @click="useMockSummary">
        <i class="fas fa-vial"></i>
        <span>测试</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getTranslationDetail } from '@/api/translation/save';
import { useAiSummary } from '@/composables/useAiSummary';
import 'animate.css';

const route = useRoute();
const router = useRouter();

// 页面状态
const isPageLeaving = ref(false);
const isLoading = ref(true);
const translationData = ref<any>({});
const idDev = import.meta.env.DEV;

// 使用AI总结组合式函数
const {
  summaryContent,
  displayedContent,
  loading,
  error,
  isStreamComplete,
  progressPercentage,
  fetchSummary,
  copySummary,
  stopGeneratingSummary,
  resetSummary,
  showFullText,
  cleanup
} = useAiSummary({
  typingSpeed: 15,
  minTypingSpeed: 10,
  maxTypingSpeed: 25,
  characterVariation: true,
  useMockData: import.meta.env.DEV && false // 开发环境可以设置为true进行测试
});

// 方法
const goBack = () => {
  isPageLeaving.value = true;
  setTimeout(() => {
    router.back();
  }, 300);
};

// 复制全部内容（原文+翻译+总结）
const copyAll = async () => {
  if (!summaryContent.value) {
    showToast('没有可复制的内容');
    return;
  }
  
  try {
    const fullContent = 
      `【AI总结】\n${summaryContent.value}\n\n` +
      `【原文内容】\n${translationData.value.originalText || ''}\n\n` +
      `【译文内容】\n${translationData.value.translatedText || ''}`;
    
    await navigator.clipboard.writeText(fullContent);
    showToast('已复制全部内容');
  } catch (err) {
    console.error('复制失败:', err);
    showToast('复制失败，请手动复制');
  }
};

// 获取翻译详情
const fetchTranslationDetail = async () => {
  const id = route.query.id as string;
  
  if (!id) {
    showToast('缺少翻译记录ID');
    goBack();
    return;
  }
  
  try {
    isLoading.value = true;
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    });
    
    // 调用API获取翻译详情
    const response = await getTranslationDetail(id);
    
    if (response.data.success) {
      translationData.value = response.data.data;
      console.log('获取到翻译详情:', translationData.value);
      
      // 获取总结
      closeToast();
      isLoading.value = false;
      
      // 延迟一点时间再调用
      setTimeout(() => {
        getSummary();
      }, 100);
      
    } else {
      showToast(response.data.message || '获取翻译详情失败');
      console.error('获取翻译详情API返回错误:', response.data);
      setTimeout(goBack, 1500);
    }
  } catch (error) {
    console.error('获取翻译详情失败:', error);
    showToast('网络错误，请稍后重试');
    setTimeout(goBack, 1500);
  } finally {
    closeToast();
    isLoading.value = false;
  }
};

// 获取AI总结
const getSummary = () => {
  if (!translationData.value || loading.value) {
    console.log('无法生成总结：', !translationData.value ? '无翻译数据' : '正在加载中');
    return;
  }
  
  console.log('重置总结状态');
  // 重置状态
  resetSummary();
  
  // 判断使用原文还是译文
  const text = translationData.value.translatedText || translationData.value.originalText;
  const language = translationData.value.targetLanguage || translationData.value.sourceLanguage;
  
  if (!text) {
    console.log('文本内容为空');
    showToast('没有可用的文本内容');
    return;
  }
  
  console.log('开始生成AI总结，文本长度:', text.length, '语言:', language);
  
  // 停止可能正在进行的请求
  stopGeneratingSummary();
  
  try {
    // 调用fetchSummary生成总结
    console.log('调用fetchSummary');
    fetchSummary({
      text,
      language
    }, true);
  } catch (err) {
    console.error('生成总结失败:', err);
    
    // 开发环境提供备用数据
    if (idDev) {
      console.log('使用开发环境备用数据');
      const mockText = "这是一段翻译文本的AI总结内容，由于API调用失败，系统生成了这段备用内容。该总结涵盖了文档的主要内容和关键点，帮助用户快速理解文档要点。在实际环境中，这段内容将由AI服务生成，更加贴合原文内容。";
      showToast('使用测试数据');
      
      // 延迟一点再显示内容，模拟API请求延迟
      setTimeout(() => {
        summaryContent.value = mockText;
        isStreamComplete.value = true;
        loading.value = false;
        showToast('已生成测试总结内容');
      }, 500);
    }
  }
};

// 处理主按钮点击事件（停止生成或重新生成）
const handleActionButtonClick = () => {
  console.log('点击主操作按钮', 'loading:', loading.value, 'isStreamComplete:', isStreamComplete.value);
  
  if (loading.value && !isStreamComplete.value) {
    console.log('停止生成总结');
    // 如果正在加载且未完成，则停止生成
    stopGeneratingSummary();
  } else {
    console.log('重新生成总结');
    // 否则重新生成
    getSummary();
  }
};

// 开发环境 - 测试用
const handleResetAll = () => {
  // 重置所有状态
  resetSummary();
  error.value = '';
  loading.value = false;
  isStreamComplete.value = false;
  
  // 重新获取总结
  setTimeout(() => {
    getSummary();
  }, 200);
  
  showToast('已重置状态');
};

// 使用模拟总结（开发环境测试用）
const useMockSummary = () => {
  if (!idDev) return;
  
  console.log('使用模拟总结内容');
  resetSummary();
  
  const mockText = "这是一段测试用的AI总结内容。该总结是通过测试模式生成的，不代表真实的API返回结果。它可以帮助开发人员在API不可用或有问题时进行界面测试。在实际环境中，这段内容将由AI服务生成，更加贴合原文内容。";
  
  // 模拟API请求延迟
  loading.value = true;
  showToast('使用测试数据');
  
  setTimeout(() => {
    summaryContent.value = mockText;
    loading.value = false;
    isStreamComplete.value = true;
    showToast('已生成测试总结内容');
  }, 800);
};

// 生命周期钩子
onMounted(() => {
  // 获取翻译详情
  fetchTranslationDetail();
  
  // 添加iOS样式类
  document.body.classList.add('iOS-style');
  
  // 预加载字体图标
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(link);
  
  // 预加载动画库
  const animateCSS = document.createElement('link');
  animateCSS.rel = 'stylesheet';
  animateCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';
  document.head.appendChild(animateCSS);
  
  // 页面进入动画 - 强制执行
  setTimeout(() => {
    const contentElements = document.querySelectorAll('.ai-summary-page > .page-element');
    console.log('找到动画元素数量:', contentElements.length);
    
    contentElements.forEach((el, index) => {
      setTimeout(() => {
        console.log('激活元素:', index);
        (el as HTMLElement).classList.add('content-visible');
      }, index * 100);
    });
  }, 300);
});

// 组件卸载时
onUnmounted(() => {
  // 清理资源
  cleanup();
  
  // 移除iOS样式类
  document.body.classList.remove('iOS-style');
});
</script>

<style scoped>
.ai-summary-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FA;
  transition: opacity 0.3s, transform 0.3s;
  position: relative;
  overflow: hidden;
}

/* 页面元素的基础动画样式 */
.ai-summary-page > .page-element {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.ai-summary-page > .page-element.content-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 页面离开动画 */
.page-leave-active {
  opacity: 0;
  transform: translateY(20px);
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 122, 255, 0.2);
  border-radius: 50%;
  border-top-color: #007AFF;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #8E8E93;
}

/* 顶部标题栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 20px;
  background-color: #FFFFFF;
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 0 0 16px 16px;
  margin-bottom: 10px;
}

.back-button {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 18px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;
}

.back-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  text-align: center;
  flex: 1;
}

/* 内容区 */
.summary-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

/* 角标 */
.summary-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 16px;
  color: #007AFF;
  font-weight: 600;
  font-size: 14px;
  margin: 8px 0 16px;
}

.summary-badge i {
  margin-right: 4px;
  font-size: 12px;
}

/* 卡片 */
.summary-card, .original-card, .translated-card {
  background-color: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.card-title i {
  margin-right: 8px;
  color: #007AFF;
}

.retry-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  background-color: rgba(0, 122, 255, 0.1);
  border: none;
  color: #007AFF;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.retry-button i {
  font-size: 14px;
  margin-right: 6px;
}

.retry-button:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.98);
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  text-align: center;
  padding: 20px;
}

.error-state i {
  font-size: 40px;
  color: #FF3B30;
  margin-bottom: 16px;
  opacity: 0.8;
}

.error-state p {
  font-size: 15px;
  color: #8E8E93;
  margin-bottom: 0;
  font-weight: 400;
}

/* 总结内容 */
.summary-content {
  padding: 16px;
}

.summary-content.stream-active .summary-text {
  min-height: 200px;
}

.summary-text {
  font-size: 16px;
  line-height: 1.6;
  color: #000;
  padding: 0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
  font-weight: 400;
}

.placeholder-text {
  color: #8E8E93;
  font-style: italic;
}

/* 打字机光标 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #007AFF;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 跳过动画按钮 */
.skip-animation-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.skip-animation-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: rgba(0, 122, 255, 0.1);
  border: none;
  color: #007AFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-animation-button i {
  margin-right: 4px;
  font-size: 12px;
}

.skip-animation-button:active {
  background-color: rgba(0, 122, 255, 0.2);
  transform: scale(0.95);
}

/* 原文和译文内容 */
.original-content, .translated-content {
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.original-content p, .translated-content p {
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.translated-content p {
  color: #007AFF;
}

/* 底部操作区 */
.bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  margin-top: auto;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  border-radius: 10px;
  background-color: rgba(142, 142, 147, 0.1);
  border: none;
  color: #8E8E93;
  font-weight: 500;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  font-size: 14px;
}

.action-button i {
  font-size: 14px;
}

.action-button:active {
  transform: scale(0.98);
  opacity: 0.8;
}

.action-button.primary-button {
  background-color: #007AFF;
  color: white;
}

.action-button.mock-button {
  background-color: #34C759;
  color: white;
  flex: 0.7;
  margin-left: 8px;
}

.reset-button {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 18px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.2s ease;
}

.reset-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}
</style> 