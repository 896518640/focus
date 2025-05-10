<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

const props = defineProps({
  transcription: {
    type: String,
    default: ''
  },
  translation: {
    type: String,
    default: ''
  },
  isActive: {
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
  // 新增：自动清理时间阈值（秒）
  autoCleanupThreshold: {
    type: Number,
    default: 300 // 5分钟
  },
  // 新增：最大文本长度
  maxTextLength: {
    type: Number,
    default: 5000 // 字符数
  }
});

const emit = defineEmits(['update:isActive']);

// 是否支持PIP API
const isPIPSupported = ref(false);
// PIP窗口引用
const pipWindow = ref<Window | null>(null);
// PIP容器元素引用
const pipContainerRef = ref<HTMLElement | null>(null);

// 跟踪用户滚动状态
const userScrolledSource = ref(false);
const userScrolledTranslation = ref(false);
const lastSourceScrollTop = ref(0);
const lastTranslationScrollTop = ref(0);

// 性能监控变量
const lastUpdateTime = ref(Date.now());
const updateCount = ref(0);
const updateFrequency = ref(0);
const memoryUsage = ref<number | null>(null);

// 文本清理计时器
let cleanupTimer: number | null = null;

// 语言映射
const languageMap: Record<string, string> = {
  cn: '中文',
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

// 格式化语言名称
const sourceLanguageName = computed(() => {
  const source = String(props.sourceLanguage);
  return languageMap[source] || source;
});

const targetLanguageName = computed(() => {
  const target = String(props.targetLanguage);
  return languageMap[target] || target;
});

// 滚动到底部的辅助函数
const scrollToBottom = (element: HTMLElement) => {
  // 使用requestAnimationFrame确保在重绘前执行滚动，提高性能和流畅度
  window.requestAnimationFrame(() => {
    // 直接先设置一个足够大的值，确保滚动到底部
    element.scrollTop = Number.MAX_SAFE_INTEGER;
    
    // 然后使用平滑滚动进行精确定位
    setTimeout(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }, 0);
  });
};

// 新增：智能节流滚动函数，避免频繁触发滚动
const throttledScrollToBottom = (() => {
  let lastScrollTime = 0;
  const throttleInterval = 30; // 减少到30ms以提高响应速度
  
  return (element: HTMLElement, force = false) => {
    const now = performance.now();
    
    // 如果强制滚动或距离上次滚动已经超过节流间隔
    if (force || now - lastScrollTime > throttleInterval) {
      lastScrollTime = now;
      scrollToBottom(element);
      
      // 为确保滚动生效，尤其是在内容动态变化的情况下，再次滚动
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 50);
      
      // 添加第三次滚动尝试，以处理可能的延迟加载内容
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 150);
    }
  };
})();

// 新增：检查是否需要自动滚动的函数
const shouldAutoScroll = (element: HTMLElement, userScrolled: boolean): boolean => {
  if (!userScrolled) return true;
  
  // 如果用户已滚动到接近底部，恢复自动滚动
  const isNearBottom = Math.abs((element.scrollHeight - element.scrollTop - element.clientHeight)) < 30;
  return isNearBottom;
};

// 新增：添加滚动到底部按钮
const addScrollToBottomButton = (container: HTMLElement, doc: Document, onClick: () => void) => {
  // 检查是否已存在滚动按钮
  const existingButton = container.querySelector('.scroll-to-bottom-btn');
  if (existingButton) return;
  
  // 创建滚动到底部按钮
  const scrollButton = doc.createElement('button');
  scrollButton.className = 'scroll-to-bottom-btn';
  scrollButton.innerHTML = '<i class="fas fa-arrow-down"></i>';
  scrollButton.title = '滚动到底部';
  scrollButton.style.cssText = `
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(52, 199, 89, 0.8);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: opacity 0.2s, transform 0.2s;
    opacity: 0.8;
    transform: scale(0.9);
  `;
  
  // 按钮悬停效果
  scrollButton.onmouseover = () => {
    scrollButton.style.opacity = '1';
    scrollButton.style.transform = 'scale(1)';
  };
  
  scrollButton.onmouseout = () => {
    scrollButton.style.opacity = '0.8';
    scrollButton.style.transform = 'scale(0.9)';
  };
  
  // 添加点击事件
  scrollButton.onclick = (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    onClick();
    
    // 显示点击反馈
    scrollButton.style.transform = 'scale(0.8)';
    setTimeout(() => {
      if (scrollButton.parentNode) {
        scrollButton.style.transform = 'scale(0.9)';
        // 500ms后隐藏按钮
        setTimeout(() => {
          if (scrollButton.parentNode) {
            container.removeChild(scrollButton);
          }
        }, 500);
      }
    }, 100);
  };
  
  // 添加按钮到容器
  container.appendChild(scrollButton);
  
  // 显示出场动画
  setTimeout(() => {
    scrollButton.style.transform = 'scale(0.9)';
  }, 10);
};

// 新增：移除滚动到底部按钮
const removeScrollToBottomButton = (container: HTMLElement, doc: Document) => {
  const scrollButton = container.querySelector('.scroll-to-bottom-btn');
  if (scrollButton) {
    scrollButton.classList.add('fade-out');
    // 添加消失动画
    (scrollButton as HTMLElement).style.opacity = '0';
    (scrollButton as HTMLElement).style.transform = 'scale(0.8) translateY(10px)';
    
    setTimeout(() => {
      if (scrollButton.parentNode) {
        container.removeChild(scrollButton);
      }
    }, 200);
  }
};

// 新增：滚动到顶部函数
const scrollToTop = (element: HTMLElement) => {
  window.requestAnimationFrame(() => {
    element.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
};

// 新增：添加滚动到顶部按钮
const addScrollToTopButton = (container: HTMLElement, doc: Document, onClick: () => void) => {
  // 检查是否已存在滚动按钮
  const existingButton = container.querySelector('.scroll-to-top-btn');
  if (existingButton) return;
  
  // 创建滚动到顶部按钮
  const scrollButton = doc.createElement('button');
  scrollButton.className = 'scroll-to-top-btn';
  scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollButton.title = '滚动到顶部';
  scrollButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(52, 199, 89, 0.8);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: opacity 0.2s, transform 0.2s;
    opacity: 0.8;
    transform: scale(0.9);
  `;
  
  // 按钮悬停效果
  scrollButton.onmouseover = () => {
    scrollButton.style.opacity = '1';
    scrollButton.style.transform = 'scale(1)';
  };
  
  scrollButton.onmouseout = () => {
    scrollButton.style.opacity = '0.8';
    scrollButton.style.transform = 'scale(0.9)';
  };
  
  // 添加点击事件
  scrollButton.onclick = (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    onClick();
    
    // 显示点击反馈
    scrollButton.style.transform = 'scale(0.8)';
    setTimeout(() => {
      if (scrollButton.parentNode) {
        scrollButton.style.transform = 'scale(0.9)';
        // 500ms后隐藏按钮
        setTimeout(() => {
          if (scrollButton.parentNode) {
            container.removeChild(scrollButton);
          }
        }, 500);
      }
    }, 100);
  };
  
  // 添加按钮到容器
  container.appendChild(scrollButton);
  
  // 显示出场动画
  setTimeout(() => {
    scrollButton.style.transform = 'scale(0.9)';
  }, 10);
};

// 处理所有滚动按钮的移除
const removeScrollButtons = (container: HTMLElement) => {
  const scrollButtons = container.querySelectorAll('.scroll-to-bottom-btn, .scroll-to-top-btn');
  
  scrollButtons.forEach(button => {
    button.classList.add('fade-out');
    // 添加消失动画
    (button as HTMLElement).style.opacity = '0';
    (button as HTMLElement).style.transform = 'scale(0.8) translateY(10px)';
    
    setTimeout(() => {
      if (button.parentNode) {
        container.removeChild(button);
      }
    }, 200);
  });
};

// 声明关闭PIP窗口函数
const closePIPWindow = () => {
  if (pipWindow.value) {
    try {
      pipWindow.value.close();
    } catch (e) {
      console.error('关闭悬浮字幕失败:', e);
    }
    pipWindow.value = null;
  }
};

// 检查浏览器是否支持PIP API
onMounted(() => {
  isPIPSupported.value = 
    'documentPictureInPicture' in window && 
    'requestWindow' in (window as any).documentPictureInPicture;
  
  // 监听PIP窗口关闭事件
  window.addEventListener('unload', closePIPWindow);
  
  // 监听窗口大小变化，重新滚动到底部
  window.addEventListener('resize', () => {
    if (pipWindow.value) {
      const pipDocument = pipWindow.value.document;
      const sourceContainer = pipDocument.querySelector('.pip-source-container');
      const translationContainer = pipDocument.querySelector('.pip-translation-container');
      
      if (sourceContainer instanceof HTMLElement && !userScrolledSource.value) {
        // 在不同的时间点尝试滚动，确保在布局重排后滚动生效
        throttledScrollToBottom(sourceContainer, true);
        // 再次尝试直接设置
        setTimeout(() => {
          sourceContainer.scrollTop = sourceContainer.scrollHeight;
        }, 50);
      }
      
      if (translationContainer instanceof HTMLElement && !userScrolledTranslation.value) {
        // 在不同的时间点尝试滚动，确保在布局重排后滚动生效
        throttledScrollToBottom(translationContainer, true);
        // 再次尝试直接设置
        setTimeout(() => {
          translationContainer.scrollTop = translationContainer.scrollHeight;
        }, 50);
      }
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('unload', closePIPWindow);
  closePIPWindow();
  
  if (cleanupTimer !== null) {
    window.clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }
});

// 监听isActive变化来打开或关闭PIP窗口
watch(() => props.isActive, async (newValue) => {
  if (newValue) {
    await openPIPWindow();
  } else {
    closePIPWindow();
  }
});

// 打开PIP窗口
const openPIPWindow = async () => {
  if (!isPIPSupported.value) {
    console.warn('此浏览器不支持悬浮字幕功能');
    emit('update:isActive', false);
    return;
  }
  
  try {
    // 如果已经有PIP窗口，先关闭
    if (pipWindow.value) {
      closePIPWindow();
    }
    
    // 创建PIP窗口
    pipWindow.value = await (window as any).documentPictureInPicture.requestWindow({
      width: 350,
      height: 240
    });
    
    if (!pipWindow.value) {
      throw new Error('无法创建悬浮窗口');
    }
    
    // 设置PIP窗口样式
    const pipDocument = pipWindow.value.document;
    
    // 添加样式
    const style = pipDocument.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #000000;
        color: #FFFFFF;
        overflow: hidden;
        user-select: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        will-change: transform;
      }
      
      .pip-container {
        padding: 12px;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        isolation: isolate; /* 创建新的堆叠上下文，提高性能 */
      }
      
      .pip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 8px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .pip-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        contain: content; /* 包含内容影响范围，优化性能 */
      }
      
      .pip-section {
        position: relative;
        border-radius: 8px;
        background-color: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        margin-bottom: 8px;
        overflow: hidden;
        transition: all 0.2s ease;
        will-change: transform;
        contain: layout; /* 包含布局重绘，优化性能 */
      }
      
      .pip-section-header {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        background-color: rgba(255, 255, 255, 0.08);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .pip-section-header i {
        margin-right: 4px;
        font-size: 9px;
      }
      
      .pip-source-container {
        height: 60px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 10px;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        will-change: scroll-position;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        overscroll-behavior: contain; /* 防止滚动链接，提高用户体验 */
        contain: paint; /* 包含绘制区域，优化性能 */
      }
      
      .pip-translation-container {
        height: 60px;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 10px;
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        will-change: scroll-position;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        overscroll-behavior: contain; /* 防止滚动链接，提高用户体验 */
        contain: paint; /* 包含绘制区域，优化性能 */
      }
      
      .pip-source {
        font-size: 13px;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.85);
        word-break: break-word;
        white-space: pre-wrap;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }
      
      .pip-translation {
        font-size: 13px;
        line-height: 1.4;
        font-weight: 500;
        color: rgba(255, 255, 255, 1);
        word-break: break-word;
        white-space: pre-wrap;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }
      
      .pip-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 6px;
        padding-top: 6px;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.4);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .pip-indicator {
        display: flex;
        align-items: center;
      }
      
      .pip-indicator i {
        font-size: 8px;
        margin-right: 4px;
        color: #34C759;
        animation: pulse 1.5s infinite;
      }
      
      .pip-brand {
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      
      /* 自定义iOS风格滚动条 */
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      
      ::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 2px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
        transition: background 0.3s;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
      }
      
      /* 动画效果 */
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
      
      /* iOS风格滚动动画 */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* 滚动指示器动画 */
      .scroll-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 4px;
        height: 20px;
        border-radius: 2px;
        background-color: rgba(255, 255, 255, 0.3);
        opacity: 0;
        transition: opacity 0.3s;
        will-change: opacity;
        pointer-events: none; /* 不阻挡点击事件 */
      }
      
      .pip-source-container:hover .scroll-indicator,
      .pip-translation-container:hover .scroll-indicator {
        opacity: 1;
      }
      
      .new-content {
        animation: highlight 1.5s ease-out;
      }
      
      /* 用于高亮新增内容的内联元素 */
      .new-content-inline {
        background-color: rgba(52, 199, 89, 0.15);
        border-radius: 2px;
        transition: background-color 1.5s ease-out;
      }
      
      @keyframes highlight {
        0% { background-color: rgba(52, 199, 89, 0.2); }
        100% { background-color: transparent; }
      }
      
      /* 为使滚动更平滑添加的额外样式 */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      .auto-scroll-active {
        position: relative;
      }
      
      .auto-scroll-active:after {
        content: "";
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #34C759;
        animation: blink 1s infinite;
        pointer-events: none; /* 不阻挡点击事件 */
        z-index: 5;
      }
      
      @keyframes blink {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      
      /* 滚动到底部按钮动画 */
      .scroll-to-bottom-btn {
        transition: opacity 0.2s, transform 0.2s;
      }
      
      .scroll-to-bottom-btn:hover {
        transform: scale(1.1) !important;
      }
      
      .scroll-to-bottom-btn:active {
        transform: scale(0.9) !important;
      }
      
      /* 滚动到顶部按钮样式 */
      .scroll-to-top-btn {
        transition: opacity 0.2s, transform 0.2s;
      }
      
      .scroll-to-top-btn:hover {
        transform: scale(1.1) !important;
      }
      
      .scroll-to-top-btn:active {
        transform: scale(0.9) !important;
      }
      
      .fade-out {
        animation: fadeOut 0.2s forwards;
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8) translateY(10px); }
      }
      
      /* 优化触摸设备上的体验 */
      @media (pointer: coarse) {
        .scroll-to-bottom-btn,
        .scroll-to-top-btn {
          width: 32px !important;
          height: 32px !important;
        }
        
        .pip-source-container,
        .pip-translation-container {
          padding: 10px 12px;
        }
      }
    `;
    pipDocument.head.appendChild(style);
    
    // 创建内容容器
    const container = pipDocument.createElement('div');
    container.className = 'pip-container';
    pipContainerRef.value = container;
    
    // 创建头部
    const header = pipDocument.createElement('div');
    header.className = 'pip-header';
    
    const sourceLabel = pipDocument.createElement('div');
    sourceLabel.textContent = `${sourceLanguageName.value} → ${targetLanguageName.value}`;
    
    const statusLabel = pipDocument.createElement('div');
    statusLabel.innerHTML = '<i class="fas fa-circle"></i> 实时同传中';
    statusLabel.style.color = '#34C759';
    statusLabel.style.fontSize = '10px';
    
    header.appendChild(sourceLabel);
    header.appendChild(statusLabel);
    
    // 创建内容区域
    const content = pipDocument.createElement('div');
    content.className = 'pip-content';
    
    // 创建源文本区域
    const sourceSection = pipDocument.createElement('div');
    sourceSection.className = 'pip-section';
    
    const sourceSectionHeader = pipDocument.createElement('div');
    sourceSectionHeader.className = 'pip-section-header';
    sourceSectionHeader.innerHTML = `<i class="fas fa-comment"></i> 原文 (${sourceLanguageName.value})`;
    
    const sourceContainer = pipDocument.createElement('div');
    sourceContainer.className = 'pip-source-container';
    
    const sourceText = pipDocument.createElement('div');
    sourceText.className = 'pip-source';
    sourceText.textContent = String(props.transcription) || '等待语音输入...';
    
    // 添加滚动指示器到源文本容器
    const sourceScrollIndicator = pipDocument.createElement('div');
    sourceScrollIndicator.className = 'scroll-indicator';
    sourceContainer.appendChild(sourceScrollIndicator);
    
    sourceContainer.appendChild(sourceText);
    sourceSection.appendChild(sourceSectionHeader);
    sourceSection.appendChild(sourceContainer);
    
    // 创建翻译文本区域
    const translationSection = pipDocument.createElement('div');
    translationSection.className = 'pip-section';
    
    const translationSectionHeader = pipDocument.createElement('div');
    translationSectionHeader.className = 'pip-section-header';
    translationSectionHeader.innerHTML = `<i class="fas fa-language"></i> 译文 (${targetLanguageName.value})`;
    
    const translationContainer = pipDocument.createElement('div');
    translationContainer.className = 'pip-translation-container';
    
    const translationText = pipDocument.createElement('div');
    translationText.className = 'pip-translation';
    translationText.textContent = String(props.translation) || '翻译将在这里显示...';
    
    // 添加滚动指示器到翻译文本容器
    const translationScrollIndicator = pipDocument.createElement('div');
    translationScrollIndicator.className = 'scroll-indicator';
    translationContainer.appendChild(translationScrollIndicator);
    
    translationContainer.appendChild(translationText);
    translationSection.appendChild(translationSectionHeader);
    translationSection.appendChild(translationContainer);
    
    content.appendChild(sourceSection);
    content.appendChild(translationSection);
    
    // 创建底部信息
    const footer = pipDocument.createElement('div');
    footer.className = 'pip-footer';
    
    const liveIndicator = pipDocument.createElement('div');
    liveIndicator.className = 'pip-indicator';
    liveIndicator.innerHTML = '<i class="fas fa-circle"></i> 实时更新中';
    
    const brandInfo = pipDocument.createElement('div');
    brandInfo.className = 'pip-brand';
    brandInfo.textContent = 'Focus 同传助手';
    
    // 新增：添加性能指标显示元素
    const performanceIndicator = pipDocument.createElement('div');
    performanceIndicator.className = 'performance-indicator';
    performanceIndicator.style.cssText = 'font-size: 9px; color: rgba(255,255,255,0.3); margin-left: 8px;';
    performanceIndicator.textContent = '0次/秒';
    
    footer.appendChild(liveIndicator);
    // 如果需要显示性能指标，取消下面这行的注释
    // footer.appendChild(performanceIndicator);
    footer.appendChild(brandInfo);
    
    // 组装PIP内容
    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(footer);
    
    pipDocument.body.appendChild(container);
    
    // 添加字体图标
    const fontAwesome = pipDocument.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    pipDocument.head.appendChild(fontAwesome);
    
    // 设置PIP窗口关闭事件
    pipWindow.value.addEventListener('unload', () => {
      emit('update:isActive', false);
      pipWindow.value = null;
    });
    
    // 强制初始滚动
    setTimeout(() => {
      if (sourceContainer instanceof HTMLElement) {
        throttledScrollToBottom(sourceContainer, true);
        sourceContainer.classList.add('auto-scroll-active');
      }
      if (translationContainer instanceof HTMLElement) {
        throttledScrollToBottom(translationContainer, true);
        translationContainer.classList.add('auto-scroll-active');
      }
    }, 100);

    // 避免初始滚动失败，添加第二次滚动尝试
    setTimeout(() => {
      if (sourceContainer instanceof HTMLElement) {
        sourceContainer.scrollTop = sourceContainer.scrollHeight;
      }
      if (translationContainer instanceof HTMLElement) {
        translationContainer.scrollTop = translationContainer.scrollHeight;
      }
    }, 300);
    
    // 添加滚动监听器到源文本容器
    sourceContainer.addEventListener('scroll', () => {
      if (sourceContainer instanceof HTMLElement) {
        const pipDocument = pipWindow.value?.document;
        if (!pipDocument) return;
        
        // 保存当前滚动位置
        lastSourceScrollTop.value = sourceContainer.scrollTop;
        
        // 更高效地检测用户是否手动滚动
        const scrollDiff = sourceContainer.scrollHeight - sourceContainer.scrollTop - sourceContainer.clientHeight;
        const isNearBottom = scrollDiff < 20;
        const isNearTop = sourceContainer.scrollTop < 20;
        
        // 处理滚动状态和按钮显示
        if (!isNearBottom) {
          // 用户向上滚动，禁用自动滚动
          if (!userScrolledSource.value) {
            userScrolledSource.value = true;
            sourceContainer.classList.remove('auto-scroll-active');
            // 添加滚动到底部按钮（如果不存在）
            addScrollToBottomButton(sourceContainer, pipDocument, () => {
              userScrolledSource.value = false;
              throttledScrollToBottom(sourceContainer, true);
            });
          }
          
          // 如果不在顶部且滚动位置超过50px，显示回到顶部按钮
          if (!isNearTop && sourceContainer.scrollTop > 50) {
            addScrollToTopButton(sourceContainer, pipDocument, () => {
              scrollToTop(sourceContainer);
            });
          } else if (isNearTop) {
            // 在顶部附近，移除回到顶部按钮
            const topButton = sourceContainer.querySelector('.scroll-to-top-btn');
            if (topButton && topButton.parentNode) {
              sourceContainer.removeChild(topButton);
            }
          }
        } else {
          // 用户滚动到底部，重新启用自动滚动
          userScrolledSource.value = false;
          sourceContainer.classList.add('auto-scroll-active');
          // 移除所有滚动按钮
          removeScrollButtons(sourceContainer);
        }
        
        // 检测滚动是否停止，并在接近底部时自动恢复滚动
        const sourceScrollStopDetector = detectScrollStopped(
          sourceContainer, 
          userScrolledSource, 
          () => throttledScrollToBottom(sourceContainer, true)
        );
        sourceScrollStopDetector();
      }
    }, { passive: true });

    // 添加滚动监听器到翻译文本容器
    translationContainer.addEventListener('scroll', () => {
      if (translationContainer instanceof HTMLElement) {
        const pipDocument = pipWindow.value?.document;
        if (!pipDocument) return;
        
        // 保存当前滚动位置
        lastTranslationScrollTop.value = translationContainer.scrollTop;
        
        // 更高效地检测用户是否手动滚动
        const scrollDiff = translationContainer.scrollHeight - translationContainer.scrollTop - translationContainer.clientHeight;
        const isNearBottom = scrollDiff < 20;
        const isNearTop = translationContainer.scrollTop < 20;
        
        // 处理滚动状态和按钮显示
        if (!isNearBottom) {
          // 用户向上滚动，禁用自动滚动
          if (!userScrolledTranslation.value) {
            userScrolledTranslation.value = true;
            translationContainer.classList.remove('auto-scroll-active');
            // 添加滚动到底部按钮（如果不存在）
            addScrollToBottomButton(translationContainer, pipDocument, () => {
              userScrolledTranslation.value = false;
              throttledScrollToBottom(translationContainer, true);
            });
          }
          
          // 如果不在顶部且滚动位置超过50px，显示回到顶部按钮
          if (!isNearTop && translationContainer.scrollTop > 50) {
            addScrollToTopButton(translationContainer, pipDocument, () => {
              scrollToTop(translationContainer);
            });
          } else if (isNearTop) {
            // 在顶部附近，移除回到顶部按钮
            const topButton = translationContainer.querySelector('.scroll-to-top-btn');
            if (topButton && topButton.parentNode) {
              translationContainer.removeChild(topButton);
            }
          }
        } else {
          // 用户滚动到底部，重新启用自动滚动
          userScrolledTranslation.value = false;
          translationContainer.classList.add('auto-scroll-active');
          // 移除所有滚动按钮
          removeScrollButtons(translationContainer);
        }
        
        // 检测滚动是否停止，并在接近底部时自动恢复滚动
        const translationScrollStopDetector = detectScrollStopped(
          translationContainer, 
          userScrolledTranslation, 
          () => throttledScrollToBottom(translationContainer, true)
        );
        translationScrollStopDetector();
      }
    }, { passive: true });

    // 为两个文本容器添加双击事件，双击时重新启用自动滚动
    sourceContainer.addEventListener('dblclick', () => {
      userScrolledSource.value = false;
      sourceContainer.classList.add('auto-scroll-active');
      if (sourceContainer instanceof HTMLElement) {
        throttledScrollToBottom(sourceContainer, true);
      }
    }, { passive: true });

    translationContainer.addEventListener('dblclick', () => {
      userScrolledTranslation.value = false;
      translationContainer.classList.add('auto-scroll-active');
      if (translationContainer instanceof HTMLElement) {
        throttledScrollToBottom(translationContainer, true);
      }
    }, { passive: true });

    // 同时保留原有的点击事件
    sourceContainer.addEventListener('click', (e) => {
      // 如果点击的是滚动按钮，不要触发此事件处理
      if (e.target && (e.target as HTMLElement).classList.contains('scroll-to-bottom-btn')) {
        return;
      }
      
      userScrolledSource.value = false;
      sourceContainer.classList.add('auto-scroll-active');
      if (sourceContainer instanceof HTMLElement) {
        throttledScrollToBottom(sourceContainer);
      }
    }, { passive: true });

    translationContainer.addEventListener('click', (e) => {
      // 如果点击的是滚动按钮，不要触发此事件处理
      if (e.target && (e.target as HTMLElement).classList.contains('scroll-to-bottom-btn')) {
        return;
      }
      
      userScrolledTranslation.value = false;
      translationContainer.classList.add('auto-scroll-active');
      if (translationContainer instanceof HTMLElement) {
        throttledScrollToBottom(translationContainer);
      }
    }, { passive: true });
    
  } catch (error) {
    console.error('打开悬浮字幕失败:', error);
    emit('update:isActive', false);
  }
};

// 新增：清理长文本的函数，减轻内存负担
const cleanupLongText = (pipDocument: Document) => {
  const sourceElement = pipDocument.querySelector('.pip-source');
  const translationElement = pipDocument.querySelector('.pip-translation');
  
  if (sourceElement && sourceElement.textContent && sourceElement.textContent.length > Number(props.maxTextLength)) {
    // 保留末尾的70%，截断前30%
    const keepLength = Math.floor(Number(props.maxTextLength) * 0.7);
    const textLength = sourceElement.textContent.length;
    const newText = sourceElement.textContent.substring(textLength - keepLength);
    
    // 添加截断指示标记
    sourceElement.textContent = '... [文本已截断] ' + newText;
  }
  
  if (translationElement && translationElement.textContent && translationElement.textContent.length > Number(props.maxTextLength)) {
    // 保留末尾的70%，截断前30%
    const keepLength = Math.floor(Number(props.maxTextLength) * 0.7);
    const textLength = translationElement.textContent.length;
    const newText = translationElement.textContent.substring(textLength - keepLength);
    
    // 添加截断指示标记
    translationElement.textContent = '... [文本已截断] ' + newText;
  }
};

// 新增：更新性能指标的函数
const updatePerformanceMetrics = () => {
  if (!pipWindow.value) return;
  
  const now = Date.now();
  const timeDiff = now - lastUpdateTime.value;
  
  if (timeDiff > 1000) { // 每秒更新一次
    updateFrequency.value = Math.round((updateCount.value / timeDiff) * 1000);
    updateCount.value = 0;
    lastUpdateTime.value = now;
    
    // 获取内存使用情况（如果浏览器支持）
    if ('performance' in window && 'memory' in (window.performance as any)) {
      memoryUsage.value = Math.round((window.performance as any).memory.usedJSHeapSize / (1024 * 1024));
    }
    
    // 更新PIP窗口中的内存和性能指标
    try {
      const pipDocument = pipWindow.value.document;
      const performanceIndicator = pipDocument.querySelector('.performance-indicator');
      
      if (performanceIndicator) {
        performanceIndicator.textContent = `${updateFrequency.value}次/秒` + 
          (memoryUsage.value ? ` | ${memoryUsage.value}MB` : '');
      }
    } catch (e) {
      console.error('更新性能指标失败:', e);
    }
    
    // 检查是否需要清理文本内容
    if (cleanupTimer === null) {
      cleanupTimer = window.setTimeout(() => {
        if (pipWindow.value) {
          cleanupLongText(pipWindow.value.document);
        }
        cleanupTimer = null;
      }, Number(props.autoCleanupThreshold) * 1000);
    }
  }
  
  updateCount.value++;
};

// 修改transcription的watch函数，加入性能监控
watch(() => props.transcription, (newValue) => {
  if (!pipWindow.value || !pipContainerRef.value) return;
  
  try {
    // 更新性能指标
    updatePerformanceMetrics();
    
    const pipDocument = pipWindow.value.document;
    const sourceElement = pipDocument.querySelector('.pip-source');
    const sourceContainer = pipDocument.querySelector('.pip-source-container');

    if (sourceElement && sourceContainer) {
      const newTranscription = String(newValue);
      
      // 内容没有变化时跳过更新，避免不必要的DOM操作
      if (sourceElement.textContent === newTranscription) return;
      
      // 检查是否仅是内容追加
      const isAppend = sourceElement.textContent && newTranscription && 
                       newTranscription.startsWith(sourceElement.textContent) && 
                       newTranscription !== sourceElement.textContent;
      
      // 性能优化：如果是追加文本，我们可以只追加新内容而不是替换整个文本
      const updateDOM = () => {
        if (isAppend) {
          // 获取新添加的部分
          const appendedText = newTranscription.slice(sourceElement.textContent!.length);
          
          // 创建新的文本节点并添加到现有内容中
          const textNode = pipDocument.createTextNode(appendedText);
          sourceElement.appendChild(textNode);
          
          // 只对新添加的部分应用高亮效果
          const highlightSpan = pipDocument.createElement('span');
          highlightSpan.className = 'new-content-inline';
          highlightSpan.textContent = appendedText;
          
          // 替换刚刚添加的文本节点
          sourceElement.removeChild(textNode);
          sourceElement.appendChild(highlightSpan);
          
          // 1.5秒后移除高亮效果
          setTimeout(() => {
            if (highlightSpan.parentNode) {
              // 使用文本节点替换高亮元素
              const normalText = pipDocument.createTextNode(appendedText);
              sourceElement.replaceChild(normalText, highlightSpan);
            }
          }, 1500);
        } else {
          // 完全替换内容
          sourceElement.textContent = newTranscription || '等待语音输入...';
          
          // 只有在内容有值时才添加动画效果
          if (newTranscription && newTranscription.length > 0) {
            sourceElement.classList.add('new-content');
            setTimeout(() => {
              if (sourceElement.classList.contains('new-content')) {
                sourceElement.classList.remove('new-content');
              }
            }, 1500);
          }
        }
      };
      
      // 使用requestAnimationFrame进行DOM更新，确保在下一帧渲染
      window.requestAnimationFrame(updateDOM);
      
      // 处理滚动逻辑
      if (sourceContainer instanceof HTMLElement) {
        // 简化滚动逻辑：如果是内容追加或用户没有手动滚动，始终滚动到底部
        if (!userScrolledSource.value || isAppend) {
          // 使用多次尝试确保滚动到底部
          throttledScrollToBottom(sourceContainer, true);
          sourceContainer.classList.add('auto-scroll-active');
          
          // 移除滚动按钮
          removeScrollButtons(sourceContainer);
          
          // 再次确保用户滚动状态正确
          userScrolledSource.value = false;
        }
      }
    }
  } catch (error) {
    console.error('更新源文本内容失败:', error);
  }
}, { immediate: true }); // 立即运行以设置初始内容

// 修改translation的watch函数
watch(() => props.translation, (newValue) => {
  if (!pipWindow.value || !pipContainerRef.value) return;
  
  try {
    const pipDocument = pipWindow.value.document;
    const translationElement = pipDocument.querySelector('.pip-translation');
    const translationContainer = pipDocument.querySelector('.pip-translation-container');
    
    if (translationElement && translationContainer) {
      const newTranslation = String(newValue);
      
      // 内容没有变化时跳过更新，避免不必要的DOM操作
      if (translationElement.textContent === newTranslation) return;
      
      // 检查是否仅是内容追加
      const isAppend = translationElement.textContent && newTranslation && 
                       newTranslation.startsWith(translationElement.textContent) && 
                       newTranslation !== translationElement.textContent;
      
      // 性能优化：如果是追加文本，我们可以只追加新内容而不是替换整个文本
      const updateDOM = () => {
        if (isAppend) {
          // 获取新添加的部分
          const appendedText = newTranslation.slice(translationElement.textContent!.length);
          
          // 创建新的文本节点并添加到现有内容中
          const textNode = pipDocument.createTextNode(appendedText);
          translationElement.appendChild(textNode);
          
          // 只对新添加的部分应用高亮效果
          const highlightSpan = pipDocument.createElement('span');
          highlightSpan.className = 'new-content-inline';
          highlightSpan.textContent = appendedText;
          
          // 替换刚刚添加的文本节点
          translationElement.removeChild(textNode);
          translationElement.appendChild(highlightSpan);
          
          // 1.5秒后移除高亮效果
          setTimeout(() => {
            if (highlightSpan.parentNode) {
              // 使用文本节点替换高亮元素
              const normalText = pipDocument.createTextNode(appendedText);
              translationElement.replaceChild(normalText, highlightSpan);
            }
          }, 1500);
        } else {
          // 完全替换内容
          translationElement.textContent = newTranslation || '翻译将在这里显示...';
          
          // 只有在内容有值时才添加动画效果
          if (newTranslation && newTranslation.length > 0) {
            translationElement.classList.add('new-content');
            setTimeout(() => {
              if (translationElement.classList.contains('new-content')) {
                translationElement.classList.remove('new-content');
              }
            }, 1500);
          }
        }
      };
      
      // 使用requestAnimationFrame进行DOM更新，确保在下一帧渲染
      window.requestAnimationFrame(updateDOM);
      
      // 处理滚动逻辑
      if (translationContainer instanceof HTMLElement) {
        // 简化滚动逻辑：如果是内容追加或用户没有手动滚动，始终滚动到底部
        if (!userScrolledTranslation.value || isAppend) {
          // 使用多次尝试确保滚动到底部
          throttledScrollToBottom(translationContainer, true);
          translationContainer.classList.add('auto-scroll-active');
          
          // 移除滚动按钮
          removeScrollButtons(translationContainer);
          
          // 再次确保用户滚动状态正确
          userScrolledTranslation.value = false;
        }
      }
    }
  } catch (error) {
    console.error('更新翻译内容失败:', error);
  }
}, { immediate: true }); // 立即运行以设置初始内容

// 新增：检测滚动停止并恢复自动滚动
const detectScrollStopped = (element: HTMLElement, userScrolled: Ref<boolean>, resetScrollFunc: () => void) => {
  let scrollTimeout: number | null = null;
  
  return () => {
    // 清除之前的超时
    if (scrollTimeout !== null) {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
    
    // 如果用户已手动滚动，设置超时检测滚动是否已停止
    if (userScrolled.value) {
      // 检查是否接近底部，如果是则恢复自动滚动
      const scrollDiff = element.scrollHeight - element.scrollTop - element.clientHeight;
      const isNearBottom = scrollDiff < 30;
      
      if (isNearBottom) {
        scrollTimeout = window.setTimeout(() => {
          userScrolled.value = false;
          element.classList.add('auto-scroll-active');
          resetScrollFunc();
          removeScrollButtons(element);
        }, 300);
      }
    }
  };
};

// 向外暴露方法
defineExpose({
  openPIPWindow,
  closePIPWindow,
  isPIPSupported
});
</script>

<template>
  <div v-if="!isPIPSupported" class="pip-not-supported">
    <i class="fas fa-exclamation-circle"></i>
    <p>您的浏览器不支持悬浮字幕功能，请使用较新版本的Chrome或Edge浏览器。</p>
  </div>
</template>

<style scoped>
.pip-not-supported {
  padding: 16px;
  background-color: #FFF3CD;
  border: 1px solid #FFEEBA;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: #856404;
}

.pip-not-supported i {
  font-size: 20px;
  margin-right: 12px;
}

.pip-not-supported p {
  margin: 0;
  font-size: 14px;
}
</style> 