/**
 * 会员套餐相关类型定义
 */

/**
 * 套餐周期类型
 */
export type PlanCycleType = 'monthly' | 'quarterly' | 'yearly';

/**
 * 套餐类型
 */
export enum PlanType {
  /** 月套餐 */
  MONTHLY = 'monthly',
  /** 季套餐 */
  QUARTERLY = 'quarterly',
  /** 年套餐 */
  YEARLY = 'yearly'
}

/**
 * 套餐信息接口
 */
export interface MembershipPlan {
  /** 套餐唯一ID */
  id: string;
  /** 套餐类型 */
  type: PlanType;
  /** 套餐名称 */
  name: string;
  /** 套餐描述 */
  description: string;
  /** 每月可用分钟数 */
  minutesPerMonth: number;
  /** 原始价格 */
  originalPrice?: number;
  /** 当前价格 */
  price: number;
  /** 价格单位 */
  priceUnit: string;
  /** 价格周期 */
  cycle: PlanCycleType;
  /** 周期文本显示 */
  cycleText: string;
  /** 是否支持退款 */
  refundable: boolean;
  /** 是否为当前套餐 */
  isCurrent?: boolean;
  /** 套餐特权列表 */
  features?: string[];
  /** 套餐标签 */
  tags?: string[];
}

/**
 * 订单创建参数
 */
export interface CreateOrderParams {
  /** 套餐ID */
  planId: string;
  /** 支付方式 */
  paymentMethod: 'wechat' | 'alipay' | 'apple';
  /** 优惠码 */
  couponCode?: string;
}

/**
 * 订单信息
 */
export interface OrderInfo {
  /** 订单ID */
  id: string;
  /** 订单状态 */
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  /** 支付URL */
  paymentUrl?: string;
  /** 创建时间 */
  createdAt: string;
  /** 支付时间 */
  paidAt?: string;
  /** 总价 */
  totalAmount: number;
  /** 折扣金额 */
  discountAmount?: number;
  /** 实际支付金额 */
  payAmount: number;
  /** 订单详情 */
  details: {
    /** 商品名称 */
    productName: string;
    /** 套餐类型 */
    planType: PlanType;
    /** 套餐周期 */
    planCycle: PlanCycleType;
  };
} 