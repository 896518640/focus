<template>
  <div class="welcome-section">
    <h2 class="welcome-title">{{ greeting }}，{{ username }}</h2>
    <p class="welcome-subtitle">{{ subtitle }}</p>
    <div class="search-bar">
      <i class="fas fa-search search-icon"></i>
      <input 
        type="text" 
        class="search-input" 
        placeholder="搜索课程、记录或功能"
        v-model="searchText"
        @focus="$emit('search-focus')"
      >
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps({
  username: {
    type: String,
    default: '访客'
  },
  subtitle: {
    type: String,
    default: '有什么可以帮到你？'
  }
});

defineEmits(['search-focus']);

const searchText = ref('');

// 根据当前时间获取问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
});
</script>

<style lang="less" scoped>
.welcome-section {
  background-color: var(--background-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.welcome-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.search-bar {
  display: flex;
  background-color: var(--background-color);
  border-radius: 10px;
  padding: 10px 15px;
  align-items: center;
}

.search-icon {
  color: var(--text-secondary);
  margin-right: 10px;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
}
</style>
