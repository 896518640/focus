<template>
  <div class="history-page">
    <!-- 顶部标题栏 -->
    <div class="header">
      <div class="header-title">历史记录</div>
      <div class="header-actions">
        <button class="header-button" @click="toggleSearch" :class="{ 'active': showSearch }">
          <i class="fas fa-search"></i>
        </button>
        <button class="header-button">
          <i class="fas fa-ellipsis-h"></i>
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <transition name="slide-fade">
      <div v-if="showSearch" class="search-bar">
        <div class="search-icon">
          <i class="fas fa-search"></i>
        </div>
        <input 
          class="search-input" 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索历史记录..." 
        />
        <transition name="fade">
          <button v-if="searchKeyword" class="search-clear" @click="clearSearch">
            <i class="fas fa-times-circle"></i>
          </button>
        </transition>
        <button class="search-cancel" @click="toggleSearch">
          取消
        </button>
      </div>
    </transition>
    
    <!-- 过滤器 -->
    <div class="filter-container">
      <div 
        v-for="option in filterOptions" 
        :key="option.value"
        class="filter-option"
        :class="{ active: activeFilter === option.value }"
        @click="setFilter(option.value)"
      >
        <span class="filter-text">{{ option.text }}</span>
      </div>
    </div>
    
    <!-- 历史记录列表 -->
    <div class="history-list" ref="historyList" @scroll="handleScroll">
      <transition-group name="list" tag="div">
        <div v-for="(group, dateKey) in groupedHistory" :key="dateKey" class="history-section">
          <div class="date-header" :class="{ 'sticky': isDateHeaderSticky[dateKey] }">{{ dateKey }}</div>
          <div class="history-items">
            <transition-group name="item">
              <div 
                v-for="item in group" 
                :key="item.id"
                class="history-item"
                :data-item-id="item.id"
              >
                <div 
                  class="history-card"
                  :data-item-id="item.id"
                  @touchstart="handleTouchStart($event, item.id)"
                  @touchmove="handleTouchMove($event, item.id)"
                  @touchend="handleTouchEnd($event, item.id)"
                  @click="viewHistoryDetail(item.id)"
                >
                  <div class="history-icon" :style="{ backgroundColor: item.color }">
                    <i :class="['fas', item.icon]"></i>
                  </div>
                  <div class="history-content">
                    <div class="history-title">{{ item.title }}</div>
                    <div class="history-info">
                      <span class="type-badge" :style="{ backgroundColor: getTypeColor(item.type) }">
                        {{ getTypeText(item.type) }}
                      </span>
                      <template v-if="item.duration">• {{ item.duration }}</template> 
                      <template v-if="item.time">• {{ item.time }}</template>
                    </div>
                    <div class="history-preview">{{ item.preview }}</div>
                    <div class="history-actions">
                      <button class="action-button" @click.stop="performAction('share', item, $event)">
                        <i class="fas fa-share-alt"></i>
                        <span>分享</span>
                      </button>
                      <button v-if="item.type !== 'translation'" class="action-button" @click.stop="performAction('translate', item, $event)">
                        <i class="fas fa-language"></i>
                        <span>翻译</span>
                      </button>
                      <button v-if="item.type !== 'summary'" class="action-button" @click.stop="performAction('summary', item, $event)">
                        <i class="fas fa-list-alt"></i>
                        <span>摘要</span>
                      </button>
                    </div>
                  </div>
                  <button class="expand-toggle" @click.stop="toggleExpand(item, $event)">
                    <i :class="['fas', item.expanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
                  </button>
                </div>
                
                <!-- 展开的内容 -->
                <transition name="expand">
                  <div class="history-expand" v-if="item.expanded">
                    <p>{{ item.content }}</p>
                    <div class="expand-actions">
                      <button class="expand-action-button" @click.stop="performAction('copy', item, $event)">
                        <i class="fas fa-copy"></i>
                        <span>复制</span>
                      </button>
                      <button class="expand-action-button" @click.stop="performAction('download', item, $event)">
                        <i class="fas fa-download"></i>
                        <span>下载</span>
                      </button>
                    </div>
                  </div>
                </transition>
                
                <!-- 滑动操作 -->
                <div class="swipe-actions">
                  <div class="swipe-action action-share" @click.stop="performAction('share', item, $event)">
                    <i class="fas fa-share-alt"></i>
                  </div>
                  <div class="swipe-action action-delete" @click.stop="deleteHistory(item.id, $event)">
                    <i class="fas fa-trash-alt"></i>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
      </transition-group>
      
      <!-- 加载指示器 -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <transition name="fade">
      <div v-if="showEmpty" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-history"></i>
        </div>
        <div class="empty-title">暂无历史记录</div>
        <div class="empty-message">开始识别或上传录音，它们将显示在这里</div>
        <button class="empty-button" @click="router.push('/recognition')">
          <span>开始使用</span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    </transition>
    
    <!-- 回到顶部按钮 -->
    <transition name="fade">
      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
        <i class="fas fa-arrow-up"></i>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showSuccessToast } from 'vant';

const router = useRouter();

// 历史记录数据
const historyItems = ref([
  {
    id: 1,
    title: '国际贸易课程摘要',
    date: '2025-03-29',
    type: 'summary',
    icon: 'fa-list-alt',
    color: 'var(--warning-color, #FF9500)',
    duration: '45分钟',
    time: '14:30',
    preview: '国际贸易主要课程内容: 1. 贸易理论基础包括比较优势理论和规模经济理论 2. 贸易政策工具如关税和非关税壁垒 3. 国际贸易组织及其功能...',
    content: '国际贸易主要课程内容: 1. 贸易理论基础包括比较优势理论和规模经济理论 2. 贸易政策工具如关税和非关税壁垒 3. 国际贸易组织及其功能和作用 4. 国际贸易实务与案例分析 5. 贸易争端解决机制与国际合作',
    expanded: false
  },
  {
    id: 2,
    title: '经济学原理课程',
    date: '2025-03-29',
    type: 'recognition',
    icon: 'fa-microphone',
    color: 'var(--accent-color, #FF2D55)',
    duration: '45分钟',
    time: '10:30',
    preview: '在经济学中，供给与需求是市场经济的基本原理。当供给增加时，价格通常会下降；而当需求增加时，价格会上升...',
    content: '在经济学中，供给与需求是市场经济的基本原理。当供给增加时，价格通常会下降；而当需求增加时，价格会上升。市场均衡是指供给和需求达到平衡的状态。宏观经济学研究的是整体经济现象，如国民生产总值、失业率和通货膨胀等。微观经济学则关注个体决策单位，如消费者和企业的决策行为。经济增长是一个国家经济能力随时间推移而增加的过程，通常通过国内生产总值（GDP）的增长来衡量。',
    expanded: false
  },
  {
    id: 3,
    title: '市场营销讲座.mp3',
    date: '2025-03-29',
    type: 'transcription',
    icon: 'fa-cloud-upload-alt',
    color: 'var(--primary-color, #007AFF)',
    duration: '30分钟',
    time: '11:15',
    preview: '市场营销的4P理论包括产品(Product)、价格(Price)、渠道(Place)和促销(Promotion)。有效的市场营销策略需要将这四个要素有机结合...',
    content: '市场营销的4P理论包括产品(Product)、价格(Price)、渠道(Place)和促销(Promotion)。有效的市场营销策略需要将这四个要素有机结合，形成一个完整的营销组合。现代营销理论已经扩展到7P，增加了人员(People)、流程(Process)和实体环境(Physical Evidence)。数字营销时代，社交媒体和内容营销变得越来越重要。',
    expanded: false
  },
  {
    id: 4,
    title: '心理学导论翻译',
    date: '2025-03-28',
    type: 'translation',
    icon: 'fa-language',
    color: 'var(--success-color, #4CD964)',
    duration: '',
    time: '10:20',
    preview: '心理学是研究人类行为和心理过程的科学。主要分支包括认知心理学、发展心理学、临床心理学、社会心理学和人格心理学...',
    content: '心理学是研究人类行为和心理过程的科学。主要分支包括认知心理学、发展心理学、临床心理学、社会心理学和人格心理学。认知心理学研究人类如何获取、处理和存储信息。发展心理学关注人类从出生到死亡的整个生命周期中的变化。临床心理学致力于诊断和治疗心理障碍。社会心理学研究人们如何受到他人存在的影响。',
    expanded: false
  },
  {
    id: 5,
    title: '数据分析方法',
    date: '2025-03-25',
    type: 'transcription',
    icon: 'fa-headphones',
    color: 'var(--primary-color, #007AFF)',
    duration: '60分钟',
    time: '15:45',
    preview: '数据分析的基本步骤包括数据收集、数据清洗、数据转换、数据建模和数据可视化。在进行数据分析时，首先需要明确分析目标...',
    content: '数据分析的基本步骤包括数据收集、数据清洗、数据转换、数据建模和数据可视化。在进行数据分析时，首先需要明确分析目标，然后根据目标选择合适的分析方法。常用的数据分析工具包括Excel、Python、R和Tableau等。数据可视化是数据分析的重要组成部分，可以帮助人们更直观地理解数据中的模式和趋势。',
    expanded: false
  }
]);

// 搜索关键词
const searchKeyword = ref('');

// 过滤选项
const filterOptions = ref([
  { text: '全部', value: 'all' },
  { text: '识别', value: 'recognition' },
  { text: '上传', value: 'transcription' },
  { text: '翻译', value: 'translation' },
  { text: '摘要', value: 'summary' }
]);

// 当前选中的过滤器
const activeFilter = ref('all');

// 是否显示搜索栏
const showSearch = ref(false);

// 是否显示空状态
const showEmpty = computed(() => Object.keys(groupedHistory.value).length === 0);

// 是否显示回到顶部按钮
const showBackToTop = ref(false);

// 是否正在加载
const isLoading = ref(false);

// 历史列表引用
const historyList = ref<HTMLElement | null>(null);

// 日期标题是否粘性
const isDateHeaderSticky = ref<Record<string, boolean>>({});

// 按日期分组的历史记录
const groupedHistory = computed(() => {
  const groups: Record<string, typeof historyItems.value> = {};
  
  // 搜索和过滤
  const filtered = historyItems.value.filter(item => {
    const matchesFilter = activeFilter.value === 'all' || item.type === activeFilter.value;
    const matchesSearch = !searchKeyword.value || 
      item.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.preview.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.content.toLowerCase().includes(searchKeyword.value.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // 按日期分组
  filtered.forEach(item => {
    const dateKey = formatDateKey(item.date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  
  return groups;
});

// 设置过滤器
const setFilter = (filter: string) => {
  activeFilter.value = filter;
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 切换搜索栏显示
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    // 下一个tick后聚焦搜索框
    nextTick(() => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    });
  } else {
    // 清空搜索内容
    searchKeyword.value = '';
  }
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

// 清空搜索内容
const clearSearch = () => {
  searchKeyword.value = '';
  // 聚焦搜索框
  const searchInput = document.querySelector('.search-input') as HTMLInputElement;
  if (searchInput) searchInput.focus();
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
};

// 查看历史记录详情
const viewHistoryDetail = (id: number) => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(15);
  }
  router.push(`/history/${id}`);
};

// 切换展开/折叠状态
const toggleExpand = (item: any, event: Event) => {
  event.stopPropagation();
  item.expanded = !item.expanded;
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(item.expanded ? 10 : 5);
  }
};

// 执行操作
const performAction = (action: string, item: any, event: Event) => {
  event.stopPropagation();
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
  
  switch (action) {
    case 'share':
      if (navigator.share) {
        navigator.share({
          title: item.title,
          text: item.content,
          url: window.location.href
        }).then(() => {
          showSuccessToast('分享成功');
        }).catch(() => {
          showToast('分享已取消');
        });
      } else {
        showToast('分享功能即将上线');
      }
      break;
    case 'translate':
      showToast({
        message: '正在准备翻译',
        icon: 'loading',
        duration: 1500
      });
      break;
    case 'summary':
      showToast({
        message: '正在生成摘要',
        icon: 'loading',
        duration: 1500
      });
      break;
    case 'copy':
      navigator.clipboard.writeText(item.content).then(() => {
        showSuccessToast('内容已复制到剪贴板');
      });
      break;
    case 'download':
      const blob = new Blob([item.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccessToast('下载成功');
      break;
    default:
      showToast(`执行 ${action} 操作`);
  }
};

// 删除历史记录
const deleteHistory = (id: number, event: Event) => {
  event.stopPropagation();
  
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 30, 10]);
  }
  
  // 获取要删除的项目
  const itemToDelete = historyItems.value.find(item => item.id === id);
  if (itemToDelete) {
    // 动画效果
    const element = document.querySelector(`.history-item[data-item-id="${id}"]`) as HTMLElement;
    if (element) {
      element.style.transition = 'all 0.3s ease';
      element.style.transform = 'translateX(-100%)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        // 实际删除数据
        historyItems.value = historyItems.value.filter(item => item.id !== id);
        showToast('已删除');
      }, 300);
    } else {
      // 如果没有找到元素，直接删除
      historyItems.value = historyItems.value.filter(item => item.id !== id);
      showToast('已删除');
    }
  }
};

// 获取类型显示文本
const getTypeText = (type: string): string => {
  switch (type) {
    case 'recognition':
      return '实时识别';
    case 'transcription':
      return '上传文件';
    case 'translation':
      return '文本翻译';
    case 'summary':
      return '课程摘要';
    default:
      return '未知类型';
  }
};

// 获取类型颜色
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'recognition':
      return 'var(--accent-color, #FF2D55)';
    case 'transcription':
      return 'var(--primary-color, #007AFF)';
    case 'translation':
      return 'var(--success-color, #4CD964)';
    case 'summary':
      return 'var(--warning-color, #FF9500)';
    default:
      return 'var(--text-secondary, #8E8E93)';
  }
};

// 格式化日期键
const formatDateKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  if (isSameDay(date, now)) {
    return '今天';
  } else if (isSameDay(date, yesterday)) {
    return '昨天';
  } else {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
};

// 判断是否同一天
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// 触摸相关变量
const touchStartX = ref(0);
const touchEndX = ref(0);
const activeSwipeItem = ref<number | null>(null);

// 触摸开始
const handleTouchStart = (event: TouchEvent, id: number) => {
  touchStartX.value = event.touches[0].clientX;
  touchEndX.value = event.touches[0].clientX;
  
  // 重置其他滑动项
  resetSwipe(id);
};

// 触摸移动
const handleTouchMove = (event: TouchEvent, id: number) => {
  touchEndX.value = event.touches[0].clientX;
  const diff = touchStartX.value - touchEndX.value;
  
  // 只允许左滑，且最大滑动距离为140px
  if (diff > 0 && diff < 140) {
    const element = event.currentTarget as HTMLElement;
    element.style.transform = `translateX(-${diff}px)`;
  }
};

// 触摸结束
const handleTouchEnd = (event: TouchEvent, id: number) => {
  const diff = touchStartX.value - touchEndX.value;
  const element = event.currentTarget as HTMLElement;
  
  if (diff > 70) {
    // 足够的滑动距离，保持打开状态
    element.style.transform = 'translateX(-140px)';
    activeSwipeItem.value = id;
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } else {
    // 不够的滑动距离，恢复原状
    element.style.transform = 'translateX(0)';
    activeSwipeItem.value = null;
  }
};

// 重置滑动状态
const resetSwipe = (exceptId?: number) => {
  if (activeSwipeItem.value !== null && activeSwipeItem.value !== exceptId) {
    const elements = document.querySelectorAll('.history-card');
    elements.forEach((el: Element) => {
      const element = el as HTMLElement;
      const itemId = Number(element.dataset.itemId);
      if (itemId !== exceptId) {
        element.style.transform = 'translateX(0)';
      }
    });
    if (exceptId === undefined) {
      activeSwipeItem.value = null;
    }
  }
};

// 滚动到顶部
const scrollToTop = () => {
  if (historyList.value) {
    historyList.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // 添加触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }
};

// 处理滚动事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  
  // 显示/隐藏回到顶部按钮
  showBackToTop.value = target.scrollTop > 300;
  
  // 检查日期标题是否应该粘性
  const dateHeaders = document.querySelectorAll('.date-header');
  const stickyState: Record<string, boolean> = {};
  
  dateHeaders.forEach((header) => {
    const rect = header.getBoundingClientRect();
    const dateKey = header.textContent || '';
    stickyState[dateKey] = rect.top <= 105;
  });
  
  isDateHeaderSticky.value = stickyState;
};

// 模拟加载更多数据
const loadMoreData = () => {
  isLoading.value = true;
  
  setTimeout(() => {
    // 模拟添加更多历史记录
    const newItems = [
      {
        id: historyItems.value.length + 1,
        title: '人工智能导论',
        date: '2025-03-20',
        type: 'recognition',
        icon: 'fa-microphone',
        color: 'var(--accent-color, #FF2D55)',
        duration: '50分钟',
        time: '09:30',
        preview: '人工智能是计算机科学的一个分支，致力于创造能够模拟人类智能的系统。机器学习是人工智能的核心技术之一...',
        content: '人工智能是计算机科学的一个分支，致力于创造能够模拟人类智能的系统。机器学习是人工智能的核心技术之一，它使计算机能够从数据中学习并改进。深度学习是机器学习的一个子领域，使用神经网络进行学习。自然语言处理和计算机视觉是人工智能的两个主要应用领域。',
        expanded: false
      },
      {
        id: historyItems.value.length + 2,
        title: '软件工程实践',
        date: '2025-03-18',
        type: 'transcription',
        icon: 'fa-cloud-upload-alt',
        color: 'var(--primary-color, #007AFF)',
        duration: '40分钟',
        time: '14:00',
        preview: '软件工程是应用系统化、规范化、可量化的方法来开发、运行和维护软件的过程。软件开发生命周期包括需求分析、设计、实现、测试和维护...',
        content: '软件工程是应用系统化、规范化、可量化的方法来开发、运行和维护软件的过程。软件开发生命周期包括需求分析、设计、实现、测试和维护。敏捷开发方法强调迭代、增量开发和团队协作。版本控制系统如Git是现代软件开发的重要工具。持续集成和持续部署可以提高软件交付的效率和质量。',
        expanded: false
      }
    ];
    
    historyItems.value = [...historyItems.value, ...newItems];
    isLoading.value = false;
  }, 1500);
};

// 监听滚动到底部，加载更多数据
const checkScrollBottom = () => {
  if (historyList.value) {
    const { scrollTop, scrollHeight, clientHeight } = historyList.value;
    if (scrollTop + clientHeight >= scrollHeight - 50 && !isLoading.value) {
      loadMoreData();
    }
  }
};

// 监听搜索关键词变化
watch(() => searchKeyword.value, () => {
  // 重置滑动状态
  resetSwipe();
});

// 监听过滤器变化
watch(() => activeFilter.value, () => {
  // 重置滑动状态
  resetSwipe();
});

// 页面加载时添加事件监听
onMounted(() => {
  // 点击事件监听，重置滑动状态
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    // 如果点击的不是滑动项或其子元素，则重置所有滑动状态
    if (!target.closest('.history-card')) {
      resetSwipe();
    }
  });
  
  // 滚动到底部加载更多
  if (historyList.value) {
    historyList.value.addEventListener('scroll', checkScrollBottom);
  }
  
  // 初始化日期标题粘性状态
  nextTick(() => {
    handleScroll({ target: historyList.value } as unknown as Event);
  });
});
</script>

<style scoped>
/* 页面容器 */
.history-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--background-color, #F2F2F7);
  overflow-x: hidden;
  position: relative;
}

/* 顶部标题栏 */
.header {
  background-color: var(--background-light, #FFFFFF);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color, #D1D1D6);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary, #000000);
  flex: 1;
  text-align: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.header-button {
  color: var(--primary-color, #007AFF);
  background: none;
  border: none;
  font-size: 18px;
  padding: 5px;
  width: 40px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.header-button:active {
  transform: scale(0.9);
  opacity: 0.7;
}

.header-button.active {
  color: var(--accent-color, #FF2D55);
}

/* 搜索栏 */
.search-bar {
  padding: 10px 16px;
  background-color: var(--background-light, #FFFFFF);
  border-bottom: 1px solid var(--border-color, #D1D1D6);
  display: flex;
  align-items: center;
  z-index: 9;
}

.search-icon {
  color: var(--text-secondary, #8E8E93);
  margin-right: 10px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 16px;
  border: none;
  border-radius: 10px;
  background-color: var(--background-dark, #E5E5EA);
}

.search-clear {
  color: var(--text-secondary, #8E8E93);
  background: none;
  border: none;
  font-size: 16px;
  padding: 5px;
  margin-left: 5px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.search-clear:active {
  transform: scale(0.9);
}

.search-cancel {
  color: var(--primary-color, #007AFF);
  background: none;
  border: none;
  font-size: 16px;
  padding: 5px 0 5px 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.search-cancel:active {
  opacity: 0.7;
}

/* 过滤器 */
.filter-container {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  background-color: var(--background-light, #FFFFFF);
  border-bottom: 1px solid var(--border-color, #D1D1D6);
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 53px;
  z-index: 9;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.filter-container::-webkit-scrollbar {
  display: none;
}

.filter-option {
  flex: 0 0 auto;
  padding: 8px 16px;
  margin-right: 8px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #8E8E93);
  background-color: var(--background-dark, #E5E5EA);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.filter-option.active {
  color: white;
  background-color: var(--primary-color, #007AFF);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.filter-option:active {
  opacity: 0.8;
  transform: scale(0.95);
}

.filter-text {
  position: relative;
  display: inline-block;
}

.filter-option.active .filter-text::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 1px;
}

/* 历史记录列表 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

.history-section {
  margin-bottom: 20px;
  animation: fadeIn 0.5s ease;
}

.date-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-left: 6px;
  color: var(--text-secondary, #8E8E93);
  transition: all 0.3s ease;
}

.date-header.sticky {
  position: sticky;
  top: 105px;
  z-index: 8;
  background-color: rgba(242, 242, 247, 0.9);
  padding: 8px 6px;
  margin-top: -8px;
  margin-bottom: 8px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  position: relative;
  overflow: hidden;
  border-radius: var(--border-radius-md, 14px);
  background-color: var(--background-light, #FFFFFF);
  box-shadow: var(--box-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.08));
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.history-item:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.history-card {
  display: flex;
  padding: 15px;
  position: relative;
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  background-color: var(--background-light, #FFFFFF);
  z-index: 2;
}

.history-icon {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.history-card:active .history-icon {
  transform: scale(0.9);
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
  color: var(--text-primary, #000000);
}

.history-info {
  font-size: 13px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.type-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  margin-right: 5px;
}

.history-preview {
  font-size: 14px;
  color: var(--text-primary, #000000);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.history-actions {
  display: flex;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.action-button {
  background-color: var(--background-color, #F2F2F7);
  color: var(--text-secondary, #8E8E93);
  border: none;
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.action-button i {
  margin-right: 5px;
  font-size: 14px;
}

.action-button:active {
  opacity: 0.7;
  transform: scale(0.95);
  background-color: var(--background-dark, #E5E5EA);
}

.expand-toggle {
  position: absolute;
  right: 15px;
  top: 15px;
  color: var(--text-secondary, #8E8E93);
  background: none;
  border: none;
  font-size: 18px;
  padding: 5px;
  z-index: 3;
  transition: transform 0.3s ease;
}

.expand-toggle:active {
  transform: scale(0.9);
}

.history-expand {
  background-color: var(--background-color, #F2F2F7);
  padding: 15px;
  border-top: 1px solid var(--border-color, #D1D1D6);
  overflow: hidden;
}

.expand-actions {
  display: flex;
  margin-top: 15px;
  gap: 10px;
}

.expand-action-button {
  background-color: var(--background-light, #FFFFFF);
  color: var(--primary-color, #007AFF);
  border: 1px solid var(--border-color, #D1D1D6);
  border-radius: 16px;
  padding: 6px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.expand-action-button i {
  margin-right: 5px;
}

.expand-action-button:active {
  opacity: 0.7;
  transform: scale(0.95);
}

/* 滑动操作菜单 */
.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  display: flex;
  transform: translateX(100%);
  z-index: 1;
}

.swipe-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 70px;
  color: white;
  font-size: 18px;
  transition: background-color 0.2s ease;
}

.swipe-action:active {
  opacity: 0.9;
}

.action-share {
  background-color: var(--success-color, #4CD964);
}

.action-delete {
  background-color: var(--danger-color, #FF3B30);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
  height: 100%;
}

.empty-icon {
  font-size: 60px;
  color: var(--text-secondary, #8E8E93);
  opacity: 0.5;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--text-primary, #000000);
}

.empty-message {
  font-size: 16px;
  color: var(--text-secondary, #8E8E93);
  margin-bottom: 25px;
  max-width: 280px;
  line-height: 1.4;
}

.empty-button {
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.empty-button i {
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.empty-button:active {
  opacity: 0.8;
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 122, 255, 0.2);
}

.empty-button:hover i {
  transform: translateX(3px);
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--background-dark, #E5E5EA);
  border-top-color: var(--primary-color, #007AFF);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary, #8E8E93);
}

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: var(--primary-color, #007AFF);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 20;
  transition: all 0.3s ease;
}

.back-to-top:active {
  transform: scale(0.9);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes expandDown {
  from { max-height: 0; opacity: 0; }
  to { max-height: 500px; opacity: 1; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 0.5; }
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.item-enter-active {
  transition: all 0.5s ease;
}

.item-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  position: absolute;
}

.item-enter-from,
.item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.item-move {
  transition: transform 0.5s ease;
}
</style>
