/**
 * toast.ts
 * 全局Toast消息提示工具
 */

import { showToast, closeToast } from 'vant';

/**
 * 显示错误提示
 * @param message 错误信息
 */
export function showErrorMessage(message: string) {
  // 控制台记录错误
  console.error('API错误:', message)
  
  // 使用 Vant Toast 显示错误
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 使用 iOS 风格配置
    showToast({
      message: message,
      type: 'fail',
      duration: 1500,
      position: 'middle',
      className: 'ios-style-toast',
      icon: 'close',
      iconSize: 20
    });
  } catch (e) {
    console.error('Toast 显示失败:', e);
    // 如果 Toast 失败，使用原生 alert 作为备选
    alert(`API错误: ${message}`);
  }
}

/**
 * 显示成功提示
 * @param message 成功信息
 */
export function showSuccessMessage(message: string) {
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 使用 iOS 风格配置
    showToast({
      message: message,
      type: 'success',
      duration: 1500,
      position: 'middle',
      className: 'ios-style-toast',
      icon: 'success',
      overlay: false,
      forbidClick: false,
      iconSize: 20
    });
  } catch (e) {
    console.error('Toast 显示失败:', e);
  }
}

/**
 * 显示警告提示
 * @param message 警告信息
 */
export function showWarningMessage(message: string) {
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 使用 iOS 风格配置
    showToast({
      message: message,
      type: 'text',
      duration: 1500,
      position: 'middle',
      className: 'ios-style-toast warning-toast',
      icon: 'warning-o',
      iconSize: 20
    });
  } catch (e) {
    console.error('Toast 显示失败:', e);
  }
}

/**
 * 显示加载提示
 * @param message 加载提示信息
 * @returns 关闭加载提示的函数
 */
export function showLoadingMessage(message: string) {
  try {
    // 先关闭可能存在的 Toast
    closeToast();
    
    // 显示加载提示
    showToast({
      message: message,
      type: 'loading',
      duration: 0, // 不自动关闭
      position: 'middle',
      className: 'ios-style-toast',
      forbidClick: true,
      loadingType: 'spinner'
    });
    
    // 返回关闭函数
    return () => {
      closeToast();
    };
  } catch (e) {
    console.error('Toast 显示失败:', e);
    // 返回空函数
    return () => {};
  }
}

// 导出所有函数
export default {
  showErrorMessage,
  showSuccessMessage,
  showWarningMessage,
  showLoadingMessage,
  closeToast
}; 