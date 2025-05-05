import { MembershipPlan, PlanType } from '@/types/membership';

/**
 * 模拟套餐数据
 */
export const mockMembershipPlans: MembershipPlan[] = [
  {
    id: 'quarterly',
    type: PlanType.QUARTERLY,
    name: '季套餐',
    description: '每月10,000分钟AI同传,支持DeepL实时翻译',
    minutesPerMonth: 10000,
    price: 89.9,
    originalPrice: 99.9,
    priceUnit: '¥',
    cycle: 'quarterly',
    cycleText: '每季度',
    refundable: true,
    features: [
      '每月10,000分钟AI同传',
      '支持DeepL实时翻译',
      '跨平台同步',
      '优先客服支持'
    ],
    tags: []
  },
  {
    id: 'monthly',
    type: PlanType.MONTHLY,
    name: '月套餐',
    description: '每月10,000分钟AI同传,支持DeepL实时翻译',
    minutesPerMonth: 10000,
    price: 33.8,
    priceUnit: '¥',
    cycle: 'monthly',
    cycleText: '每月',
    refundable: true,
    features: [
      '每月10,000分钟AI同传',
      '支持DeepL实时翻译',
      '基础客服支持'
    ],
    tags: []
  },
  {
    id: 'yearly',
    type: PlanType.YEARLY,
    name: '年套餐',
    description: '每月10,000分钟AI同传,支持DeepL实时翻译',
    minutesPerMonth: 10000,
    price: 339,
    originalPrice: 405.6, // 按月计算的原价
    priceUnit: '¥',
    cycle: 'yearly',
    cycleText: '每年',
    refundable: true,
    features: [
      '每月10,000分钟AI同传',
      '支持DeepL实时翻译',
      'AI摘要生成',
      '跨平台同步',
      '高级客服支持',
      '优先获取新功能'
    ],
    tags: ['最具性价比']
  }
];

/**
 * 获取套餐列表
 * @returns 套餐列表承诺
 */
export const getMembershipPlans = (): Promise<MembershipPlan[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMembershipPlans);
    }, 500);
  });
};

/**
 * 创建订单
 * @param planId 套餐ID
 * @returns 支付链接承诺
 */
export const createOrder = (planId: string): Promise<{ paymentUrl: string; orderId: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paymentUrl: 'https://example.com/pay',
        orderId: `order_${Date.now()}`
      });
    }, 800);
  });
}; 