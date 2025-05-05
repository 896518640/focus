<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showLoadingToast, closeToast, showFailToast } from 'vant';
import { getMembershipPlans, createMembershipOrder } from '@/api/membership';
import { MembershipPlan } from '@/types/membership';
import PlanCard from '@/components/membership/PlanCard.vue';

// 路由
const router = useRouter();

// 状态变量
const loading = ref(false);
const plans = ref<MembershipPlan[]>([]);
const selectedPlanId = ref<string>('');
const isAgreementChecked = ref(true);
const isProcessing = ref(false);

// 动画状态
const animations = reactive({
  pageEntered: false,
  headerAnimated: false,
  plansAnimated: false,
  agreementAnimated: false,
  buttonAnimated: false,
  purchaseAnimation: false
});

// 选中的套餐信息
const selectedPlan = computed(() => {
  return plans.value.find(plan => plan.id === selectedPlanId.value);
});

// 页面初始化
onMounted(async () => {
  await fetchMembershipPlans();
  
  // 触发入场动画序列
  setTimeout(() => { animations.pageEntered = true }, 50);
  setTimeout(() => { animations.headerAnimated = true }, 200);
  setTimeout(() => { animations.plansAnimated = true }, 400);
  setTimeout(() => { animations.agreementAnimated = true }, 600);
  setTimeout(() => { animations.buttonAnimated = true }, 800);
});

/**
 * 获取套餐列表
 */
const fetchMembershipPlans = async () => {
  loading.value = true;
  showLoadingToast({
    message: '加载中...',
    forbidClick: true,
    duration: 0
  });
  
  try {
    const data = await getMembershipPlans();
    plans.value = data;
    
    // 默认选中季度套餐
    if (data.length > 0 && !selectedPlanId.value) {
      const quarterlyPlan = data.find(plan => plan.type === 'quarterly');
      selectedPlanId.value = quarterlyPlan?.id || data[0].id;
    }
  } catch (error) {
    console.error('获取套餐失败', error);
    showFailToast('获取套餐信息失败');
  } finally {
    loading.value = false;
    closeToast();
  }
};

/**
 * 选择套餐
 */
const selectPlan = (planId: string) => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  selectedPlanId.value = planId;
};

/**
 * 处理协议切换
 */
const toggleAgreement = () => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(3);
  }
  
  isAgreementChecked.value = !isAgreementChecked.value;
};

/**
 * 处理确认购买
 */
const handlePurchase = async () => {
  if (!selectedPlanId.value) {
    showFailToast('请选择一个套餐');
    return;
  }
  
  if (!isAgreementChecked.value) {
    showFailToast('请先同意协议');
    return;
  }
  
  // 触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate([10, 20, 10]);
  }
  
  // 启动购买动画
  animations.purchaseAnimation = true;
  isProcessing.value = true;
  
  loading.value = true;
  showLoadingToast({
    message: '创建订单中...',
    forbidClick: true,
    duration: 0
  });
  
  try {
    const result = await createMembershipOrder({
      planId: selectedPlanId.value,
      paymentMethod: 'wechat'
    });
    
    closeToast();
    
    // 实际应用中这里应该跳转到支付页面或打开支付链接
    console.log('支付链接:', result.paymentUrl);
    console.log('订单ID:', result.orderId);
    
    // 模拟跳转前的延迟
    setTimeout(() => {
      // 退出动画
      animations.pageEntered = false;
      
      // 跳转
      setTimeout(() => {
        // router.push(`/payment/${result.orderId}`);
        router.push('/');
      }, 300);
    }, 1000);
  } catch (error) {
    console.error('创建订单失败', error);
    showFailToast('创建订单失败');
    animations.purchaseAnimation = false;
    isProcessing.value = false;
  } finally {
    loading.value = false;
  }
};

/**
 * 返回上一页
 */
const goBack = () => {
  // 添加触觉反馈
  if ('vibrate' in navigator) {
    navigator.vibrate(5);
  }
  
  // 退出动画
  animations.pageEntered = false;
  
  // 延迟导航以等待动画
  setTimeout(() => {
    router.back();
  }, 300);
};
</script>

<template>
  <div class="membership-page" :class="{ 'page-entered': animations.pageEntered }">
    <!-- 顶部导航栏 -->
    <div class="header" :class="{ 'header-animated': animations.headerAnimated }">
      <div class="header-left" @click="goBack">
        <i class="fas fa-chevron-left"></i>
        <span>返回</span>
      </div>
      <div class="header-title">会员套餐</div>
      <div class="header-right"></div>
    </div>
    
    <!-- 标题和描述 -->
    <div class="membership-intro" :class="{ 'intro-animated': animations.headerAnimated }">
      <div class="membership-icon">
        <i class="fas fa-crown"></i>
      </div>
      <h2 class="membership-title">Focus Premium</h2>
      <p class="membership-description">解锁全部高级功能，提升您的体验</p>
    </div>
    
    <!-- 套餐列表 -->
    <div class="plan-list-container" :class="{ 'plans-animated': animations.plansAnimated }">
      <div class="plan-list">
        <div 
          v-for="(plan, index) in plans" 
          :key="plan.id"
          class="plan-card-wrapper"
          :style="{ '--delay': `${index * 0.1}s` }"
        >
          <div 
            class="plan-card" 
            :class="{ 'selected': selectedPlanId === plan.id }"
            @click="selectPlan(plan.id)"
          >
            <div class="plan-content">
              <div class="plan-type">{{ plan.title }}</div>
              <div class="plan-price">
                <span class="currency">¥</span>
                <span class="amount">{{ plan.price }}</span>
                <span class="period">/{{ plan.billingCycle }}</span>
              </div>
              <div class="plan-savings" v-if="plan.savings">
                <div class="savings-badge">省{{ plan.savings }}%</div>
              </div>
            </div>
            <div class="plan-check">
              <div class="check-icon" v-if="selectedPlanId === plan.id">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 套餐特权 -->
    <div class="benefits-section" :class="{ 'benefits-animated': animations.agreementAnimated }">
      <div class="benefit-item" v-for="(benefit, index) in ['无限次翻译', '高级AI功能', '优先客服支持', '无广告体验']" :key="index">
        <div class="benefit-icon">
          <i :class="['fas', 
            index === 0 ? 'fa-language' : 
            index === 1 ? 'fa-brain' : 
            index === 2 ? 'fa-headset' : 
            'fa-ban'
          ]"></i>
        </div>
        <div class="benefit-text">{{ benefit }}</div>
      </div>
    </div>
    
    <!-- 协议部分 -->
    <div class="agreement-section" :class="{ 'agreement-animated': animations.agreementAnimated }">
      <div class="agreement-checkbox" @click="toggleAgreement">
        <div class="checkbox" :class="{ 'checkbox-checked': isAgreementChecked }">
          <i class="fas fa-check" v-if="isAgreementChecked"></i>
        </div>
        <div class="agreement-text">
          购买即表示您同意
          <a href="javascript:void(0);" class="agreement-link">服务条款</a>
          和
          <a href="javascript:void(0);" class="agreement-link">自动续费规则</a>
        </div>
      </div>
    </div>
    
    <!-- 购买按钮 -->
    <div class="purchase-section" :class="{ 'button-animated': animations.buttonAnimated }">
      <button 
        class="purchase-button" 
        :class="{ 
          'disabled': !selectedPlanId || !isAgreementChecked || loading,
          'processing': animations.purchaseAnimation
        }"
        @click="handlePurchase"
        :disabled="!selectedPlanId || !isAgreementChecked || loading || isProcessing"
      >
        <span class="button-text" v-if="!animations.purchaseAnimation">{{ selectedPlan ? `立即订阅 ¥${selectedPlan.price}` : '选择套餐' }}</span>
        <span class="button-processing" v-else>
          <span class="processing-dot"></span>
          <span class="processing-dot"></span>
          <span class="processing-dot"></span>
        </span>
      </button>
      
      <div class="additional-info">
        <p>随时可取消·安全支付·自动续费</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 页面容器 */
.membership-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #F2F2F7;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease-out;
}

.page-entered {
  opacity: 1;
  transform: translateY(0);
}

/* 顶部导航栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(209, 209, 214, 0.5);
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.header-animated {
  transform: translateY(0);
  opacity: 1;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #000000;
}

.header-left {
  display: flex;
  align-items: center;
  color: #007AFF;
  font-size: 16px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.header-left span {
  margin-left: 4px;
}

.header-left:active {
  opacity: 0.7;
}

.header-right {
  width: 60px;
}

/* 会员介绍 */
.membership-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.intro-animated {
  opacity: 1;
  transform: translateY(0);
}

.membership-icon {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  font-size: 28px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
}

.membership-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #000000;
}

.membership-description {
  font-size: 16px;
  color: #8E8E93;
  margin: 0;
  text-align: center;
}

/* 套餐列表 */
.plan-list-container {
  padding: 0 16px;
  margin: 16px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.plans-animated {
  opacity: 1;
  transform: translateY(0);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-card-wrapper {
  opacity: 0;
  transform: translateY(10px);
  animation: slideIn 0.5s ease forwards;
  animation-delay: var(--delay, 0s);
}

.plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.plan-card:active {
  transform: scale(0.98);
  background-color: rgba(0, 0, 0, 0.02);
}

.plan-card.selected {
  border-color: #007AFF;
}

.plan-content {
  flex: 1;
}

.plan-type {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 4px;
}

.plan-price {
  display: flex;
  align-items: baseline;
}

.currency {
  font-size: 16px;
  color: #000000;
  margin-right: 2px;
}

.amount {
  font-size: 24px;
  font-weight: 700;
  color: #000000;
}

.period {
  font-size: 14px;
  color: #8E8E93;
  margin-left: 2px;
}

.plan-savings {
  margin-top: 6px;
}

.savings-badge {
  display: inline-block;
  padding: 3px 8px;
  background-color: #FFF3CD;
  color: #D48806;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}

.plan-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.plan-card.selected .plan-check {
  border-color: #007AFF;
  background-color: #007AFF;
}

.check-icon {
  color: white;
  font-size: 12px;
}

/* 特权部分 */
.benefits-section {
  padding: 0 16px;
  margin: 20px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.benefits-animated {
  opacity: 1;
  transform: translateY(0);
}

.benefit-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.benefit-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.benefit-text {
  font-size: 14px;
  color: #000000;
  font-weight: 500;
}

/* 协议部分 */
.agreement-section {
  padding: 0 16px;
  margin: 20px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.agreement-animated {
  opacity: 1;
  transform: translateY(0);
}

.agreement-checkbox {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #C7C7CC;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  font-size: 12px;
}

.checkbox-checked {
  background-color: #007AFF;
  border-color: #007AFF;
  color: white;
}

.agreement-text {
  font-size: 14px;
  color: #8E8E93;
  padding-top: 2px;
}

.agreement-link {
  color: #007AFF;
  text-decoration: none;
}

/* 购买按钮 */
.purchase-section {
  padding: 0 16px 32px;
  margin-top: auto;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.button-animated {
  opacity: 1;
  transform: translateY(0);
}

.purchase-button {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
  border: none;
  color: white;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.purchase-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.7s;
}

.purchase-button:hover::before {
  left: 100%;
}

.purchase-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.purchase-button.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.purchase-button.processing {
  background: #007AFF;
}

.button-processing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.processing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
  opacity: 0.7;
  animation: pulse 1.5s infinite;
}

.processing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.processing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

.additional-info {
  text-align: center;
}

.additional-info p {
  font-size: 12px;
  color: #8E8E93;
  margin: 0;
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  .membership-page {
    background-color: #1C1C1E;
  }
  
  .header {
    background-color: rgba(28, 28, 30, 0.9);
    border-bottom-color: rgba(60, 60, 65, 0.5);
  }
  
  .header-title {
    color: #FFFFFF;
  }
  
  .membership-title {
    color: #FFFFFF;
  }
  
  .plan-card {
    background-color: #2C2C2E;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .plan-card:active {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .plan-type {
    color: #FFFFFF;
  }
  
  .amount, .currency {
    color: #FFFFFF;
  }
  
  .benefit-item {
    background-color: #2C2C2E;
  }
  
  .benefit-text {
    color: #FFFFFF;
  }
}
</style> 