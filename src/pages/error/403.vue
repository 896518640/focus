<template>
  <div class="error-page">
    <van-empty description="403 - 无权限访问" />
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
