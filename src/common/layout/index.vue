<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainLayout from './MainLayout.vue';

const route = useRoute();

// 计算当前路由路径，用于确定激活的导航项
const currentPath = computed(() => route.path);

// 根据路由元数据判断是否显示导航栏
const showNav = computed(() => {
  return route.meta.showNav !== false;
});
</script>

<template>
  <MainLayout :active-tab="currentPath" :show-nav="showNav">
    <router-view />
  </MainLayout>
</template>
