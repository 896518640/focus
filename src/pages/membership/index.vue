<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showLoadingToast, showSuccessToast, closeToast, showFailToast } from 'vant';
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

// 页面初始化
onMounted(async () => {
  await fetchMembershipPlans();
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
  selectedPlanId.value = planId;
};

/**
 * 处理协议切换
 */
const toggleAgreement = () => {
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
    showSuccessToast('订单创建成功');
    
    // 实际应用中这里应该跳转到支付页面或打开支付链接
    console.log('支付链接:', result.paymentUrl);
    console.log('订单ID:', result.orderId);
    
    // 模拟跳转
    setTimeout(() => {
      // router.push(`/payment/${result.orderId}`);
      router.push('/');
    }, 1500);
  } catch (error) {
    console.error('创建订单失败', error);
    showFailToast('创建订单失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 返回上一页
 */
const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="membership-page">
    <div class="page-header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" size="24" />
      </div>
      <h1 class="page-title">购买套餐</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="plan-list">
      <PlanCard
        v-for="plan in plans"
        :key="plan.id"
        :plan="plan"
        :selected="selectedPlanId === plan.id"
        @select="selectPlan"
      />
    </div>
    
    <div class="agreement-section">
      <label class="agreement-label" @click="toggleAgreement">
        <div class="checkbox" :class="{ checked: isAgreementChecked }">
          <van-icon name="success" v-if="isAgreementChecked" />
        </div>
        <span>放心购买，微信客服随时为您服务！</span>
      </label>
      
      <div class="agreement-links">
        <a href="javascript:void(0);" class="agreement-link">《隐私协议》</a>
        <a href="javascript:void(0);" class="agreement-link">《自动续费协议》</a>
      </div>
    </div>
    
    <div class="buy-button-container">
      <button 
        class="confirm-button"
        :disabled="!selectedPlanId || !isAgreementChecked || loading"
        @click="handlePurchase"
      >
        恢复购买
      </button>
    </div>
  </div>
</template>

<style scoped>
.membership-page {
  padding: 0 20px 30px;
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  position: relative;
}

.back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.placeholder {
  width: 40px;
}

.plan-list {
  flex: 1;
  margin: 16px 0;
}

.agreement-section {
  margin: 20px 0;
}

.agreement-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  color: #555;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.checkbox.checked {
  background-color: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.agreement-links {
  margin-top: 8px;
  margin-left: 28px;
  display: flex;
  gap: 10px;
}

.agreement-link {
  color: #3B82F6;
  font-size: 14px;
  text-decoration: none;
}

.buy-button-container {
  margin-top: 20px;
}

.confirm-button {
  width: 100%;
  padding: 12px;
  background-color: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-button:disabled {
  background-color: #a0c0f8;
  cursor: not-allowed;
}
</style> 