# 实时翻译模块 (RealtimeTranslation)

这个模块是对原始 `useRealtimeTranslation` 钩子函数的重构版本，通过模块化设计和关注点分离提高了代码的可维护性和可读性。

## 重构目标

- 将超过1700行的单一文件拆分为多个功能模块
- 分离关注点，使每个模块专注于一个功能领域
- 提高代码可读性和可维护性
- 保持API兼容性，确保现有代码不需要大量修改

## 模块结构

模块按功能领域进行了拆分：

1. **types.ts**: 定义所有类型和接口
2. **useWebSocket.ts**: 管理WebSocket连接、消息发送和事件处理
3. **useAudioProcessor.ts**: 处理音频录制、处理和传输
4. **useChapterManager.ts**: 管理章节的创建、历史记录和缓存恢复
5. **useSessionManager.ts**: 管理会话状态、句子跟踪和结果构建
6. **useMessageHandler.ts**: 解析和处理WebSocket消息
7. **useApiService.ts**: 处理API调用，如创建任务和获取任务信息
8. **index.ts**: 组合所有模块，导出主钩子函数

## 使用方法

使用方式与原来的钩子函数保持一致：

```typescript
import { useRealtimeTranslation } from '@/hooks/useRealtimeTranslation'

// 在组件中使用
const {
  isInitialized,
  isConnecting,
  isConnected,
  isTranslating,
  isError,
  errorMessage,
  transcriptionResult,
  translationResult,
  
  initializeTask,
  startTranslation,
  pauseTranslation,
  resumeTranslation,
  stopTranslation,
  clearResults
} = useRealtimeTranslation({
  sourceLanguage: 'cn',
  targetLanguages: ['en'],
  onTranscriptionResult: (text) => {
    console.log('收到转写结果:', text)
  },
  onTranslationResult: (text) => {
    console.log('收到翻译结果:', text)
  },
  onError: (error) => {
    console.error('发生错误:', error)
  }
})
```

## 模块详细说明

### types.ts
定义了所有模块共享的类型和接口，包括配置选项、数据结构和返回类型。

### useWebSocket.ts
管理WebSocket连接的生命周期，包括:
- 连接和断开WebSocket
- 发送文本和二进制数据
- 设置心跳检测
- 处理异常断开和自动重连

### useAudioProcessor.ts
负责音频采集和处理，包括:
- 初始化麦克风
- 处理音频数据
- 转换音频格式
- 清理音频资源

### useChapterManager.ts
管理文本内容的章节划分，包括:
- 跟踪章节历史
- 缓存内容
- 恢复内容
- 添加章节标记

### useSessionManager.ts
管理会话和句子状态，包括:
- 跟踪会话变化
- 管理句子状态
- 构建完整的转写和翻译结果
- 检测新会话

### useMessageHandler.ts
处理WebSocket消息，包括:
- 解析转写结果
- 解析翻译结果
- 生成命令消息
- 处理各种API响应

### useApiService.ts
处理与API服务器的交互，包括:
- 创建实时翻译任务
- 获取任务信息
- 停止任务
- 处理API错误

### index.ts
主模块，组合所有功能模块并提供统一的API，确保与原始钩子函数的接口兼容性。 