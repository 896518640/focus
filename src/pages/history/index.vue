<template>
  <div class="history-page" :class="{ 'page-leave-active': isPageLeaving }">
    <!-- 顶部标题栏 -->
    <div class="header animate__animated animate__fadeInDown page-element">
      <div class="header-title">历史记录</div>
      <div class="header-actions">
        <button class="header-button" @click="toggleSearch" :class="{ 'active': showSearch }">
          <i class="fas fa-search"></i>
        </button>
        <button class="header-button" @click="router.push('/home')">
          <i class="fas fa-home"></i>
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <SearchBar
      v-model="searchKeyword"
      :visible="showSearch"
      @clear="clearSearch"
      @close="toggleSearch"
    />
    
    <!-- 过滤器 -->
    <FilterBar
      v-model="activeFilter"
      :filter-options="filterOptions"
      class="animate__animated animate__fadeIn page-element"
      style="animation-delay: 0.1s;"
    />
    
    <!-- 历史记录列表 -->
    <HistoryList
      :items="filteredItems"
      :is-loading="isLoading"
      :load-error="loadError"
      :error-message="errorMessage"
      :has-more="hasMore"
      @retry="loadTranslationRecords"
      @load-more="loadMoreRecords"
      @view="viewTranslationDetail"
      @delete="handleDeleteTranslation"
      @share="handleShareTranslation"
      @download="handleDownloadTranslation"
      @copy="handleCopyTranslation"
      class="animate__animated animate__fadeIn page-element"
      style="animation-delay: 0.2s;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';
import { getTranslationList, deleteTranslation, SaveTranslationParams, SaveTranslationResponse, TranslationListResponse, ApiResponse } from '@/api/translation/save';
import SearchBar from '@/components/history/SearchBar.vue';
import FilterBar from '@/components/history/FilterBar.vue';
import HistoryList from '@/components/history/HistoryList.vue';
import 'animate.css';

const router = useRouter();

// 完整的历史记录项接口
interface HistoryItem extends SaveTranslationParams, SaveTranslationResponse {}

// 页面离开动画状态
const isPageLeaving = ref(false);

// 搜索和筛选状态
const showSearch = ref(false);
const searchKeyword = ref('');
const activeFilter = ref('all');

// 筛选选项
const filterOptions = [
  { text: '全部', value: 'all' },
  { text: '实时翻译', value: 'realtime' },
  { text: '上传翻译', value: 'upload' },
  { text: '最近添加', value: 'recent' },
  { text: '最长时间', value: 'longest' }
];

// 数据加载状态
const isLoading = ref(false);
const loadError = ref(false);
const errorMessage = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const hasMore = ref(true);

// 历史记录数据
const translationItems = ref<HistoryItem[]>([]);

// 切换搜索栏显示
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    searchKeyword.value = '';
  }
};

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = '';
};

// 加载翻译记录列表
const loadTranslationRecords = async (reset = true) => {
  try {
    isLoading.value = true;
    loadError.value = false;
    errorMessage.value = '';
    
    if (reset) {
      currentPage.value = 1;
      hasMore.value = true;
      translationItems.value = [];
    }
    
    const response = await getTranslationList(currentPage.value, pageSize.value);
    
    if (response.data.success && response.data.data) {
      if (reset) {
        translationItems.value = response.data.data.list;
      } else {
        translationItems.value = [...translationItems.value, ...response.data.data.list];
      }
      
      totalItems.value = response.data.data.total || 0;
      hasMore.value = translationItems.value.length < totalItems.value;
    } else {
      loadError.value = true;
      errorMessage.value = response.data.message || '获取数据失败，请稍后重试';
      console.error('获取翻译记录失败:', response);
    }
  } catch (error) {
    loadError.value = true;
    errorMessage.value = '网络错误，请检查连接后重试';
    console.error('加载翻译记录出错:', error);
  } finally {
    isLoading.value = false;
  }
};

// 加载更多记录
const loadMoreRecords = async () => {
  if (isLoading.value || !hasMore.value) return;
  
  currentPage.value++;
  await loadTranslationRecords(false);
};

// 筛选的记录
const filteredItems = computed(() => {
  let filtered = [...translationItems.value];
  
  // 搜索关键词筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(item => 
      (item.title && item.title.toLowerCase().includes(keyword)) || 
      (item.originalText && item.originalText.toLowerCase().includes(keyword)) || 
      (item.translatedText && item.translatedText.toLowerCase().includes(keyword))
    );
  }
  
  // 根据过滤条件筛选
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'realtime') {
      filtered = filtered.filter(item => item.outputMp3Path);
    } else if (activeFilter.value === 'upload') {
      filtered = filtered.filter(item => !item.outputMp3Path);
    } else if (activeFilter.value === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeFilter.value === 'longest') {
      filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }
  }
  
  return filtered;
});

// 查看翻译详情
const viewTranslationDetail = (id: string) => {
  isPageLeaving.value = true;
  setTimeout(() => {
    router.push({
      path: '/translation-detail',
      query: { id }
    });
  }, 300);
};

// 回到首页
const goToHome = () => {
  isPageLeaving.value = true;
  setTimeout(() => {
    router.push('/home');
  }, 300);
};

// 删除翻译记录
const handleDeleteTranslation = async (id: string) => {
  try {
    if (confirm('确定要删除这条翻译记录吗？')) {
      const response = await deleteTranslation(id);
      
      if (response.data.success) {
        showSuccessToast('删除成功');
        // 从当前列表中移除该记录
        translationItems.value = translationItems.value.filter(item => item.id !== id);
        // 如果列表为空且还有更多数据，重新加载
        if (translationItems.value.length === 0 && hasMore.value) {
          await loadTranslationRecords();
        }
      } else {
        showToast(response.data.message || '删除失败');
      }
    }
  } catch (error) {
    console.error('删除翻译记录失败:', error);
    showToast('删除失败，请稍后重试');
  }
};

// 分享翻译记录
const handleShareTranslation = (id: string) => {
  const item = translationItems.value.find(item => item.id === id);
  if (!item) return;
  
  // 构建分享文本
  let shareText = `${item.title || '翻译记录'}\n`;
  shareText += `${item.sourceLanguage} → ${item.targetLanguage}\n`;
  shareText += `原文: ${item.originalText}\n`;
  shareText += `翻译: ${item.translatedText}\n`;
  
  // 复制到剪贴板
  navigator.clipboard.writeText(shareText)
    .then(() => showSuccessToast('已复制到剪贴板，可以分享给他人'))
    .catch(() => showToast('复制失败，请手动复制'));
};

// 下载翻译音频
const handleDownloadTranslation = (id: string) => {
  const item = translationItems.value.find(item => item.id === id);
  if (!item || !item.outputMp3Path) {
    showToast('没有可下载的音频');
    return;
  }
  
  // 实际实现时需要根据API返回的路径创建下载链接
  showToast('下载功能开发中...');
};

// 复制翻译内容
const handleCopyTranslation = (id: string) => {
  const item = translationItems.value.find(item => item.id === id);
  if (!item) return;
  
  const copyText = `原文: ${item.originalText}\n\n翻译: ${item.translatedText}`;
  
  navigator.clipboard.writeText(copyText)
    .then(() => showSuccessToast('复制成功'))
    .catch(() => showToast('复制失败，请手动复制'));
};

// 监听筛选变化
watch(activeFilter, () => {
  // 如果筛选条件变化，重置滚动位置
});

// 监听搜索变化
watch(searchKeyword, () => {
  // 如果搜索条件变化，重置滚动位置
});

// 组件挂载时加载数据和添加动画效果
onMounted(() => {
  loadTranslationRecords();
  
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
  
  // 页面进入动画
  setTimeout(() => {
    const contentElements = document.querySelectorAll('.history-page > .page-element');
    contentElements.forEach((el, index) => {
      setTimeout(() => {
        (el as HTMLElement).classList.add('content-visible');
      }, index * 100);
    });
  }, 300);
});

// 组件卸载时
onUnmounted(() => {
  document.body.classList.remove('iOS-style');
});
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F8F9FA;
  transition: opacity 0.3s, transform 0.3s;
  position: relative;
}

/* 页面元素的基础动画样式 */
.history-page > .page-element {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.history-page > .page-element.content-visible {
  opacity: 1;
  transform: translateY(0);
}

/* 页面离开动画 */
.page-leave-active {
  opacity: 0;
  transform: translateY(20px);
}

/* 顶部标题栏 */
.header {
  background-color: #FFFFFF;
  padding: 5px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 10;
  border-radius: 0 0 16px 16px;
  margin-bottom: 10px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-button {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-button:active {
  transform: scale(0.95);
  background-color: rgba(0, 122, 255, 0.1);
}

.header-button.active {
  background-color: #007AFF;
  color: #FFFFFF;
}

/* 为iOS设备添加的样式 */
:global(.iOS-style) {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
</style>
