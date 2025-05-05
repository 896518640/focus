import { request } from '@/http/axios';
import { MembershipPlan, CreateOrderParams } from '@/types/membership';
import { getMembershipPlans as getMockPlans, createOrder as createMockOrder } from './mock';

// 是否使用模拟数据
const useMockData = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

/**
 * 获取会员套餐列表
 * @returns 会员套餐列表
 */
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  if (useMockData) {
    return getMockPlans();
  }
  
  return request<MembershipPlan[]>({
    url: '/api/v1/membership/plans',
    method: 'GET'
  });
}

/**
 * 创建会员订单
 * @param params 创建订单参数
 * @returns 订单信息，包含支付URL
 */
export async function createMembershipOrder(params: CreateOrderParams): Promise<{ paymentUrl: string; orderId: string }> {
  if (useMockData) {
    return createMockOrder(params.planId);
  }
  
  return request<{ paymentUrl: string; orderId: string }>({
    url: '/api/v1/membership/orders',
    method: 'POST',
    data: params
  });
}

/**
 * 查询订单状态
 * @param orderId 订单ID
 * @returns 订单状态
 */
export async function checkOrderStatus(orderId: string): Promise<{ status: string }> {
  if (useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'pending' });
      }, 500);
    });
  }
  
  return request<{ status: string }>({
    url: `/api/v1/membership/orders/${orderId}/status`,
    method: 'GET'
  });
}

/**
 * 获取当前用户会员信息
 * @returns 会员信息
 */
export async function getCurrentMembership(): Promise<{
  plan: string;
  expireAt: string;
  minutesLeft: number;
  totalMinutes: number;
  isActive: boolean;
}> {
  if (useMockData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          plan: 'monthly',
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          minutesLeft: 8500,
          totalMinutes: 10000,
          isActive: true
        });
      }, 500);
    });
  }
  
  return request<{
    plan: string;
    expireAt: string;
    minutesLeft: number;
    totalMinutes: number;
    isActive: boolean;
  }>({
    url: '/api/v1/membership/current',
    method: 'GET'
  });
} 