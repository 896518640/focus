<template>
  <div class="error-page">
    <van-empty description="404 - 页面不存在" />
    <van-button type="primary" block @click="$router.push('/')">返回首页</van-button>
  </div>
</template>

<style scoped>
.error-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}

.van-button {
  margin-top: 20px;
  width: 200px;
}
</style>
