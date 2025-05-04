import { ref, Ref } from 'vue'
import { showFailToast } from 'vant'

interface WebSocketOptions {
  onOpen?: () => void
  onMessage?: (event: MessageEvent) => void
  onError?: (error: Error) => void
  onClose?: (event: CloseEvent) => void
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const wsConnection = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const heartbeatInterval = ref<number | null>(null)
  
  // 连接WebSocket
  const connect = async (url: string) => {
    if (!url) {
      console.log('未提供WebSocket URL，无法建立连接')
      return Promise.reject(new Error('未提供WebSocket URL'))
    }
    
    // 检查现有WebSocket连接状态
    if (wsConnection.value) {
      const connectionState = wsConnection.value.readyState
      
      if (connectionState === WebSocket.OPEN) {
        console.log('WebSocket连接已经存在且处于开启状态，无需重新连接')
        isConnected.value = true
        return Promise.resolve(true)
      } else if (connectionState === WebSocket.CONNECTING) {
        console.log('WebSocket正在连接中，等待连接完成')
        return new Promise((resolve, reject) => {
          // 设置临时事件处理，等待连接完成或失败
          const originalOnOpen = wsConnection.value!.onopen
          const originalOnError = wsConnection.value!.onerror
          
          // 设置临时的onopen处理
          wsConnection.value!.onopen = (event) => {
            // 恢复原始处理器
            wsConnection.value!.onopen = originalOnOpen
            wsConnection.value!.onerror = originalOnError
            
            // 确保调用原始的onopen
            if (originalOnOpen && wsConnection.value) {
              originalOnOpen.call(wsConnection.value, event)
            }
            
            resolve(true)
          }
          
          // 设置临时的onerror处理
          wsConnection.value!.onerror = (event) => {
            // 恢复原始处理器
            wsConnection.value!.onopen = originalOnOpen
            wsConnection.value!.onerror = originalOnError
            
            // 确保调用原始的onerror
            if (originalOnError && wsConnection.value) {
              originalOnError.call(wsConnection.value, event)
            }
            
            reject(new Error('WebSocket连接失败'))
          }
          
          // 设置连接超时
          setTimeout(() => {
            // 如果仍在连接中，则是超时
            if (wsConnection.value && wsConnection.value.readyState === WebSocket.CONNECTING) {
              // 恢复原始处理器
              wsConnection.value.onopen = originalOnOpen
              wsConnection.value.onerror = originalOnError
              
              reject(new Error('WebSocket连接超时'))
            }
          }, 10000) // 10秒超时
        })
      } else {
        // 状态为CLOSING或CLOSED
        console.log(`WebSocket连接状态异常(${connectionState})，将关闭现有连接并创建新连接`)
        
        // 移除事件处理程序，避免触发重新连接逻辑
        wsConnection.value.onclose = null
        try {
          wsConnection.value.close()
        } catch (error) {
          console.error('关闭旧WebSocket连接出错:', error)
        }
        wsConnection.value = null
        
        // 清理心跳
        clearHeartbeat()
      }
    } else {
      console.log('首次创建WebSocket连接')
    }
    
    return new Promise<boolean>((resolve, reject) => {
      let connectionTimeout: number | null = null;
      
      try {
        isConnecting.value = true
        
        // 创建WebSocket连接
        console.log('正在连接WebSocket...', url)
        wsConnection.value = new WebSocket(url)
        
        // 设置二进制类型为ArrayBuffer
        wsConnection.value.binaryType = 'arraybuffer'
        
        // 设置连接超时
        connectionTimeout = window.setTimeout(() => {
          if (wsConnection.value && wsConnection.value.readyState === WebSocket.CONNECTING) {
            // 连接超时，手动关闭
            try {
              wsConnection.value.onopen = null
              wsConnection.value.onerror = null
              wsConnection.value.onclose = null
              wsConnection.value.close()
            } catch (err) {
              console.error('关闭超时连接出错:', err)
            }
            
            wsConnection.value = null
            isConnecting.value = false
            
            reject(new Error('WebSocket连接超时'))
          }
        }, 10000) // 10秒超时
        
        // 连接成功处理
        wsConnection.value.onopen = (event) => {
          if (connectionTimeout !== null) {
            clearTimeout(connectionTimeout)
          }
          
          // 正常的打开事件处理
          handleOpen(event)
          resolve(true)
        }
        
        // 连接失败处理
        wsConnection.value.onerror = (event) => {
          if (connectionTimeout !== null) {
            clearTimeout(connectionTimeout)
          }
          
          // 处理错误
          handleError(event)
          reject(new Error('WebSocket连接失败'))
        }
        
        // 其他事件处理
        wsConnection.value.onmessage = handleMessage
        wsConnection.value.onclose = handleClose
        
      } catch (error) {
        if (connectionTimeout !== null) {
          clearTimeout(connectionTimeout)
        }
        handleConnectionError(error)
        reject(error)
      }
    })
  }
  
  // 发送文本消息
  const sendMessage = (message: string | object) => {
    if (!wsConnection.value || wsConnection.value.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket未连接，无法发送消息')
      return false
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      wsConnection.value.send(messageStr)
      return true
    } catch (error) {
      console.error('发送WebSocket消息失败:', error)
      return false
    }
  }
  
  // 发送二进制数据
  const sendBinaryData = (data: ArrayBuffer) => {
    if (!wsConnection.value) {
      if (Math.random() < 0.01) { // 减少日志量
        console.warn('WebSocket未初始化，无法发送二进制数据')
      }
      return false
    }
    
    const connectionState = wsConnection.value.readyState
    
    if (connectionState !== WebSocket.OPEN) {
      if (Math.random() < 0.01) { // 减少日志量
        console.warn(`WebSocket连接状态异常(${connectionState})，无法发送二进制数据`)
      }
      return false
    }
    
    try {
      // 添加一个检查，确保是有效的ArrayBuffer
      if (!(data instanceof ArrayBuffer)) {
        console.error('无效的二进制数据类型:', typeof data)
        return false
      }
      
      // 也检查数据长度是否合理
      if (data.byteLength === 0) {
        if (Math.random() < 0.01) { // 减少日志量
          console.warn('尝试发送空的二进制数据')
        }
        return false
      }
      
      // 检查数据大小，如果超过16KB，分块发送
      if (data.byteLength > 16384) { // 16KB
        const chunks = Math.ceil(data.byteLength / 16384)
        if (Math.random() < 0.01) { // 减少日志量
          console.log(`音频数据过大(${data.byteLength}字节)，分${chunks}块发送`)
        }
        
        for (let i = 0; i < chunks; i++) {
          const start = i * 16384
          const end = Math.min(start + 16384, data.byteLength)
          const chunk = data.slice(start, end)
          
          // 再次检查连接状态，避免发送过程中连接已关闭
          if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
            wsConnection.value.send(chunk)
          } else {
            console.warn('发送过程中WebSocket连接已关闭，中止发送')
            return false
          }
        }
      } else {
        // 再次检查连接状态，以防在函数执行过程中连接状态改变
        if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
          // 直接发送
          wsConnection.value.send(data)
        } else {
          console.warn('发送前WebSocket连接已关闭，无法发送数据')
          return false
        }
      }
      return true
    } catch (error) {
      console.error('发送WebSocket二进制数据失败:', error)
      return false
    }
  }
  
  // 断开WebSocket连接
  const disconnect = (code?: number, reason?: string) => {
    if (!wsConnection.value) {
      console.log('WebSocket已断开，无需再次断开');
      return;
    }
    
    console.log(`主动断开WebSocket连接: code=${code}, reason=${reason}`);
    
    // 清理心跳定时器
    clearHeartbeat();
    
    // 设置WebSocket已标记为即将关闭，防止处理额外消息
    const connection = wsConnection.value;
    wsConnection.value = null;
    isConnected.value = false;
    
    try {
      // 尝试正常断开连接
      if (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING) {
        connection.close(code || 1000, reason || "用户主动断开");
      }
    } catch (error) {
      console.error('断开WebSocket连接出错:', error);
    }
    
    // 确保连接确实已关闭
    setTimeout(() => {
      if (connection.readyState !== WebSocket.CLOSED) {
        console.warn('WebSocket未能在预期时间内关闭，强制销毁实例');
        // 此处不能直接使用connection.close，因为它可能已经不可用
        // 相反，我们将引用置空，让垃圾回收处理
      }
    }, 1000);
  }
  
  // 设置心跳检测
  const setupHeartbeat = (pingInterval: number = 5000, pingMessage?: any) => {
    clearHeartbeat()
    
    heartbeatInterval.value = window.setInterval(() => {
      if (pingMessage) {
        sendMessage(pingMessage)
      }
      
      if (Math.random() < 0.1) { // 仅记录10%的心跳，避免日志过多
        console.log('发送心跳...')
      }
    }, pingInterval)
  }
  
  // 清除心跳检测
  const clearHeartbeat = () => {
    if (heartbeatInterval.value !== null) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }
  
  // WebSocket 打开事件处理
  const handleOpen = (event: Event) => {
    isConnected.value = true
    isConnecting.value = false
    console.log('WebSocket连接已打开')
    
    if (options.onOpen) {
      options.onOpen()
    }
  }
  
  // WebSocket 消息事件处理
  const handleMessage = (event: MessageEvent) => {
    if (options.onMessage) {
      options.onMessage(event)
    }
  }
  
  // WebSocket 错误事件处理
  const handleError = (event: Event) => {
    console.error('WebSocket错误:', event)
    
    if (options.onError) {
      options.onError(new Error('WebSocket连接错误'))
    }
  }
  
  // WebSocket 关闭事件处理
  const handleClose = (event: CloseEvent) => {
    console.log(`WebSocket连接已关闭: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`)
    
    // 清理心跳检测
    clearHeartbeat()
    
    // 更新连接状态
    isConnected.value = false
    isConnecting.value = false
    
    if (options.onClose) {
      options.onClose(event)
    }
  }
  
  // 处理连接错误
  const handleConnectionError = (error: any) => {
    isConnecting.value = false
    console.error('连接WebSocket失败:', error)
    showFailToast('连接翻译服务失败')
    
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error('连接WebSocket失败'))
    }
  }
  
  return {
    wsConnection,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage,
    sendBinaryData,
    setupHeartbeat,
    clearHeartbeat
  }
} 