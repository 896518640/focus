import { ref, computed } from 'vue';
import { showToast, showLoadingToast, closeToast } from 'vant';
import { getUserProfileApi, updateUserProfileApi } from '@/api/users';
import { RecentTranslation } from '@/types/api/users';

/**
 * 用户资料相关组合式函数
 */
export function useUserProfile() {
  // 用户信息
  const userInfo = ref({
    user_id: '',
    displayName: '',
    email: '',
    avatar: '',
    role: '',
    createdAt: '',
    lastLoginAt: '',
    membership: {
      level: 'free',
      next_reset_time: '',
      total_minutes: 0,
      used_minutes: 0,
      remaining_minutes: 0
    },
    usage: {
      transcribeMinutesUsed: 0,
      translateMinutesUsed: 0,
      translationCount: 0
    },
    features: {
      translationEnabled: false
    },
    settings: {
      id: '',
      sourceLanguage: 'cn',
      targetLanguage: 'en',
      translationEnabled: true,
      autoSave: false,
      theme: 'light',
      userId: ''
    },
    recent_translations: [] as RecentTranslation[]
  });

  // 页面状态
  const isLoading = ref(false);
  const pageLoaded = ref(false);
  const avatarHovered = ref(false);

  // 同传设置
  const sourceLanguage = ref('cn');
  const targetLanguage = ref('en');

  // 动画状态
  const statsLoaded = ref(false);
  const activityLoaded = ref(false);

  /**
   * 计算属性：格式化创建时间
   */
  const formattedCreatedAt = computed(() => {
    if (!userInfo.value.createdAt) return '';
    
    const date = new Date(userInfo.value.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  });

  /**
   * 计算属性：加入天数
   */
  const joinDays = computed(() => {
    if (!userInfo.value.createdAt) return 0;
    
    const createdDate = new Date(userInfo.value.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  });

  /**
   * 计算属性：会员等级显示名称
   */
  const membershipLevelDisplay = computed(() => {
    const levelMap: Record<string, string> = {
      'free': '普通会员',
      'basic': '基础会员',
      'pro': '专业会员',
      'premium': '高级会员'
    };
    
    return levelMap[userInfo.value.membership.level] || '普通会员';
  });

  /**
   * 计算属性：获取已使用分钟数百分比
   */
  const usedMinutesPercentage = computed(() => {
    const { total_minutes, used_minutes } = userInfo.value.membership;
    if (!total_minutes) return 0;
    
    const percentage = (used_minutes / total_minutes) * 100;
    return Math.min(percentage, 100);
  });

  /**
   * 计算属性：格式化下次重置时间
   */
  const formattedNextResetTime = computed(() => {
    if (!userInfo.value.membership.next_reset_time) return '';
    
    const date = new Date(userInfo.value.membership.next_reset_time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  });

  /**
   * 获取用户详细资料
   */
  const fetchUserProfile = async () => {
    isLoading.value = true;
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    });
    
    try {
      const userData = await getUserProfileApi();
      console.log('用户资料API响应:', userData);
      
      userInfo.value = {
        user_id: userData.user_id || '',
        displayName: userData.displayName || '',
        email: userData.email || '',
        avatar: userData.avatar || '',
        role: userData.role || '',
        createdAt: userData.createdAt || '',
        lastLoginAt: userData.lastLoginAt || '',
        membership: userData.membership || {
          level: 'free',
          next_reset_time: '',
          total_minutes: 0,
          used_minutes: 0,
          remaining_minutes: 0
        },
        usage: userData.usage || {
          transcribeMinutesUsed: 0,
          translateMinutesUsed: 0,
          translationCount: 0
        },
        features: userData.features || {
          translationEnabled: false
        },
        settings: userData.settings || {
          id: '',
          sourceLanguage: 'cn',
          targetLanguage: 'en',
          translationEnabled: true,
          autoSave: false,
          theme: 'light',
          userId: ''
        },
        recent_translations: userData.recent_translations || []
      };
      
      // 同步设置
      sourceLanguage.value = userData.settings?.sourceLanguage || 'cn';
      targetLanguage.value = userData.settings?.targetLanguage || 'en';
    } catch (error: any) {
      console.error('获取用户资料出错:', error);
      
      showToast({
        message: error.message || '网络错误',
        position: 'bottom',
      });
    } finally {
      isLoading.value = false;
      closeToast();
      
      // 设置页面已加载状态，触发显示动画
      setTimeout(() => {
        pageLoaded.value = true;
      }, 100);
      
      setTimeout(() => {
        statsLoaded.value = true;
      }, 300);
      
      setTimeout(() => {
        activityLoaded.value = true;
      }, 600);
    }
  };

  /**
   * 编辑用户头像
   */
  const editAvatar = async () => {
    // 实际应用中可以实现图片上传逻辑
    // 这里简化处理，使用一个随机头像
    const randomId = Math.floor(Math.random() * 100);
    const newAvatar = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomId}.jpg`;
    
    try {
      showLoadingToast({
        message: '更新中...',
        forbidClick: true,
      });
      
      const res = await updateUserProfileApi({
        avatar: newAvatar
      });
      
      userInfo.value.avatar = newAvatar;
      showToast({
        message: '头像更新成功',
        position: 'bottom',
        type: 'success'
      });
    } catch (error: any) {
      console.error('更新头像出错:', error);
      showToast({
        message: error.message || '网络错误',
        position: 'bottom',
      });
    } finally {
      closeToast();
    }
  };

  /**
   * 处理源语言变更
   */
  const handleSourceLanguageChange = (lang: string) => {
    sourceLanguage.value = lang;
  };

  /**
   * 处理目标语言变更
   */
  const handleTargetLanguageChange = (lang: string) => {
    targetLanguage.value = lang;
  };

  /**
   * 保存同传设置
   */
  const saveTranslationSettings = async () => {
    try {
      // 这里应该调用更新设置的API
      showToast({
        message: '设置已保存',
        position: 'bottom',
        type: 'success'
      });
    } catch (error: any) {
      console.error('保存设置出错:', error);
      showToast({
        message: error.message || '保存失败',
        position: 'bottom',
      });
    }
  };

  return {
    userInfo,
    isLoading,
    pageLoaded,
    avatarHovered,
    sourceLanguage,
    targetLanguage,
    statsLoaded,
    activityLoaded,
    formattedCreatedAt,
    joinDays,
    membershipLevelDisplay,
    usedMinutesPercentage,
    formattedNextResetTime,
    fetchUserProfile,
    editAvatar,
    handleSourceLanguageChange,
    handleTargetLanguageChange,
    saveTranslationSettings
  };
} 