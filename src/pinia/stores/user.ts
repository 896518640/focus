import { pinia } from "@/pinia"
import { getCurrentUserApi } from "@/api/users"
import { setToken as _setToken, getToken, removeToken } from "@/utils/cache/cookies"
import { ref, computed, watch } from 'vue';

// 添加翻译历史相关接口定义
export interface TranslationHistoryItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isFavorite: boolean;
  isVoice?: boolean;
}

export interface UserPreferences {
  defaultSourceLanguage: string;
  defaultTargetLanguage: string;
  autoTranslate: boolean;
  autoSpeak: boolean;
  speechRate: number;
  theme: 'light' | 'dark' | 'system';
}

// 初始用户配置
const defaultPreferences: UserPreferences = {
  defaultSourceLanguage: 'zh_cn',
  defaultTargetLanguage: 'en_us',
  autoTranslate: true,
  autoSpeak: false,
  speechRate: 1,
  theme: 'system',
};

export const useUserStore = defineStore("user", () => {
  // === 用户认证相关状态 ===
  const token = ref<string>(getToken() || "")
  const roles = ref<string[]>([])
  const username = ref<string>("")
  const userId = ref<string>("")
  const email = ref<string>("")
  const role = ref<string>("")
  const isActive = ref<boolean>(false)

  // === 添加翻译历史相关状态 ===
  const translationHistory = ref<TranslationHistoryItem[]>([]);
  const profile = ref({
    id: '',
    username: '游客',
    email: '',
    avatar: '',
    isPremium: false,
    isGuest: false,
    preferences: { ...defaultPreferences },
  });

  // === 用户认证相关计算属性 ===
  const isLoggedIn = computed(() => !!token.value);

  // === 翻译历史相关计算属性 ===
  const favoriteTranslations = computed(() => {
    if (!translationHistory.value) return [];
    return translationHistory.value.filter(item => item.isFavorite);
  });

  // === 用户认证相关方法 ===
  
  // 设置 Token
  const setToken = (value: string) => {
    _setToken(value)
    token.value = value
  }

  // 获取用户详情
  const getInfo = async () => {
    try {
      const { data } = await getCurrentUserApi()
      username.value = data.username
      userId.value = data.id
      email.value = data.email
      role.value = data.role
      roles.value = data.roles || [data.role]
      isActive.value = data.isActive
      console.log('data', data)

      // 更新用户个人资料
      profile.value = {
        id: data.id,
        username: data.username,
        email: data.email,
        avatar: '',
        isPremium: data.role === 'admin' || data.role === 'premium',
        isGuest: false,
        preferences: { ...defaultPreferences },
      }

      return data
    } catch (error) {
      resetToken()
      return null
    }
  }

  const changeRoles = (role: string) => {
    const newToken = `token-${role}`
    token.value = newToken
    _setToken(newToken)
    // 用刷新页面代替重新登录
    location.reload()
  }

  // 重置 Token
  const resetToken = () => {
    removeToken()
    token.value = ""
    roles.value = []
    username.value = ""
    userId.value = ""
    email.value = ""
    role.value = ""
    isActive.value = false
    
    // 重置用户资料为游客状态
    profile.value = {
      id: '',
      username: '游客',
      email: '',
      avatar: '',
      isPremium: false,
      isGuest: true,
      preferences: { ...defaultPreferences },
    }
  }
  
  // 退出登录
  const logout = () => {
    resetToken();
    // 重置用户资料
    profile.value = {
      id: '',
      username: '游客',
      email: '',
      avatar: '',
      isPremium: false,
      isGuest: true,
      preferences: { ...defaultPreferences },
    };
  }

  // 设置游客模式
  const setGuestMode = (value: boolean) => {
    profile.value.isGuest = value;
    if (value) {
      profile.value.username = '游客';
      profile.value.email = '';
      profile.value.avatar = '';
    }
  }

  // === 翻译历史相关方法 ===
  
  // 保存翻译历史
  function saveTranslation(item: Omit<TranslationHistoryItem, 'id' | 'timestamp' | 'isFavorite'>) {
    const newItem: TranslationHistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
      isFavorite: false,
    };
    
    translationHistory.value = [newItem, ...translationHistory.value].slice(0, 100); // 限制最多保存100条
    
    // 保存到本地存储
    localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
  }
  
  // 切换收藏状态
  function toggleFavorite(id: string) {
    const index = translationHistory.value.findIndex(item => item.id === id);
    if (index !== -1) {
      translationHistory.value[index].isFavorite = !translationHistory.value[index].isFavorite;
      
      // 更新存储
      localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
    }
  }
  
  // 删除历史记录
  function deleteHistoryItem(id: string) {
    translationHistory.value = translationHistory.value.filter(item => item.id !== id);
    
    // 更新存储
    localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
  }
  
  // 清空历史记录
  function clearHistory() {
    translationHistory.value = [];
    
    // 更新存储
    localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
  }
  
  // 更新翻译历史
  function updateTranslationHistory(newHistory: TranslationHistoryItem[]) {
    translationHistory.value = newHistory;
    
    // 更新存储
    localStorage.setItem('translation_history', JSON.stringify(translationHistory.value));
  }
  
  // 更新用户偏好设置
  function updatePreferences(newPreferences: Partial<UserPreferences>) {
    profile.value.preferences = {
      ...profile.value.preferences,
      ...newPreferences,
    };
    
    // 保存设置
    localStorage.setItem('user_preferences', JSON.stringify(profile.value.preferences));
  }
  
  // 初始化
  function init() {
    // 加载本地偏好设置
    const savedPreferences = localStorage.getItem('user_preferences');
    if (savedPreferences) {
      try {
        profile.value.preferences = {
          ...defaultPreferences,
          ...JSON.parse(savedPreferences),
        };
      } catch (e) {
        console.error('Failed to parse user preferences', e);
      }
    }
    
    // 加载历史记录
    loadHistory();
  }
  
  // 加载历史记录
  function loadHistory() {
    // 从本地存储加载
    const savedHistory = localStorage.getItem('translation_history');
    if (savedHistory) {
      try {
        translationHistory.value = JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to parse translation history', e);
      }
    }
  }

  // 初始化
  init();

  return { 
    // 认证相关导出
    token, roles, username, userId, email, role, isActive, isLoggedIn,
    setToken, getInfo, changeRoles, resetToken, logout, setGuestMode,
    
    // 翻译历史相关导出
    profile, translationHistory, favoriteTranslations,
    saveTranslation, toggleFavorite, deleteHistoryItem, 
    clearHistory, updateTranslationHistory, updatePreferences
  }
})

/**
 * @description 在 SPA 应用中可用于在 pinia 实例被激活前使用 store
 * @description 在 SSR 应用中可用于在 setup 外使用 store
 */
export function useUserStoreOutside() {
  return useUserStore(pinia)
}
