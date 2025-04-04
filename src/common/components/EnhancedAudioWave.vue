<template>
  <div class="wave-container" :style="{ width, height }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  width: { type: String, default: '300px' },
  height: { type: String, default: '100px' },
  color: { type: String, default: '#00aaff' },
  mic: { type: Boolean, default: false }, // 是否启用麦克风
  alwaysAnimate: { type: Boolean, default: true }, // 总是显示动画
  smoothing: { type: Number, default: 0.85 }, // 增加平滑度
  fftSize: { type: Number, default: 1024 }  // 增加采样率
})

const canvasRef = ref(null)
let audioContext = null
let analyser = null
let dataArray = null
let source = null
let animationFrameId = null
let mediaStream = null
let transitionFactor = 0.15 // 波形平滑过渡因子
let previousPoints = [] // 上一帧的波形点
let useSimulatedData = true // 是否使用模拟数据
let lastTransitionTime = 0 // 上次切换时间
const switchCooldown = 500 // 切换冷却时间(ms)，防止频繁切换
let audioLevelHistory = [] // 音频电平历史
const historyLength = 10 // 历史记录长度

// 初始化音频上下文和分析器
const initAudio = async () => {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    
    // 设置FFT大小和平滑系数
    analyser.fftSize = props.fftSize
    analyser.smoothingTimeConstant = props.smoothing
    
    // 创建数据数组
    const bufferLength = analyser.frequencyBinCount
    dataArray = new Uint8Array(bufferLength)
    
    if (props.mic) {
      // 访问麦克风输入
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        source = audioContext.createMediaStreamSource(mediaStream)
        source.connect(analyser)
        // 不连接到destination，避免回声
        useSimulatedData = false
      } catch (err) {
        console.error('麦克风访问失败:', err)
        createOscillator() // 降级到振荡器
        useSimulatedData = true
      }
    } else {
      // 不使用麦克风时，显示静态线条
      useSimulatedData = false
    }
    
    // 开始绘制
    draw()
  } catch (err) {
    console.error('音频初始化失败:', err)
  }
}

// 创建振荡器作为音频源
const createOscillator = () => {
  if (!audioContext) return
  
  // 创建振荡器
  const oscillator = audioContext.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
  
  // 创建增益节点来控制音量
  const gainNode = audioContext.createGain()
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // 低音量
  
  // 连接节点链
  oscillator.connect(gainNode)
  gainNode.connect(analyser)
  
  // 保存源以便后续清理
  source = oscillator
  
  // 开始振荡
  oscillator.start()
}

// 生成模拟波形的点
const generateSimulatedPoints = (width, height, time) => {
  const points = []
  const waveCount = 3 // 波浪数量
  const amplitude = height * 0.15 // 波浪高度
  
  for (let i = 0; i <= width; i += width / 80) { // 增加点的密度，使曲线更平滑
    // 组合多个正弦波，产生更自然的波形
    const y = height / 2 + 
      Math.sin(i / width * Math.PI * waveCount * 2 + time * 2) * amplitude * 0.5 +
      Math.sin(i / width * Math.PI * waveCount + time * 1.7) * amplitude * 0.3 +
      Math.sin(i / width * Math.PI * waveCount * 3 + time * 2.5) * amplitude * 0.2;
      
    points.push({ x: i, y })
  }
  
  return points
}

// 从音频数据生成波形点
const generateAudioPoints = (width, height, audioData, bufferLength) => {
  const points = []
  const sliceWidth = width / bufferLength
  let maxAmplitude = 0
  
  // 计算平均音频电平和最大振幅
  let avgLevel = 0
  for (let i = 0; i < bufferLength; i++) {
    const value = audioData[i]
    avgLevel += value
    if (value > maxAmplitude) {
      maxAmplitude = value
    }
    
    // 取样点，不用每个点都取
    if (i % 3 === 0) {
      points.push({
        x: i * sliceWidth,
        y: height - (value / 255) * height * 0.8
      })
    }
  }
  avgLevel = avgLevel / bufferLength
  
  // 更新音频电平历史
  audioLevelHistory.push(avgLevel)
  if (audioLevelHistory.length > historyLength) {
    audioLevelHistory.shift()
  }
  
  // 计算平均历史电平
  const avgHistoryLevel = audioLevelHistory.reduce((sum, level) => sum + level, 0) / audioLevelHistory.length
  
  // 决定是否切换到模拟数据
  // 只有在音频电平持续较低的情况下才切换
  if (Date.now() - lastTransitionTime > switchCooldown) {
    if (avgHistoryLevel < 20 && !useSimulatedData) {
      useSimulatedData = true
      lastTransitionTime = Date.now()
    } else if (avgHistoryLevel >= 20 && useSimulatedData) {
      useSimulatedData = false
      lastTransitionTime = Date.now()
    }
  }
  
  return { points, useSimulated: maxAmplitude < 15 }
}

// 平滑融合两组点
const smoothPoints = (newPoints, oldPoints, factor) => {
  if (!oldPoints || oldPoints.length === 0) return newPoints
  
  const result = []
  // 使用插值来平滑过渡
  for (let i = 0; i < newPoints.length; i++) {
    // 找到最近的旧点
    const newPoint = newPoints[i]
    let closest = null
    let minDist = Infinity
    
    for (let j = 0; j < oldPoints.length; j++) {
      const dist = Math.abs(newPoint.x - oldPoints[j].x)
      if (dist < minDist) {
        minDist = dist
        closest = oldPoints[j]
      }
    }
    
    if (closest) {
      // 线性插值
      result.push({
        x: newPoint.x,
        y: newPoint.y * (1 - factor) + closest.y * factor
      })
    } else {
      result.push(newPoint)
    }
  }
  
  return result
}

// 绘制波形
const draw = () => {
  if (!canvasRef.value || !analyser) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  // 调整画布大小以匹配容器
  canvas.width = canvas.parentElement.clientWidth
  canvas.height = canvas.parentElement.clientHeight
  
  const width = canvas.width
  const height = canvas.height
  
  // 清除画布
  ctx.clearRect(0, 0, width, height)
  
  // 只有在mic=true时才显示动态波形
  if (!props.mic) {
    // 在mic=false时显示静态线条
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.strokeStyle = props.color
    ctx.lineWidth = 1.5
    ctx.stroke()
    
    // 重置状态
    previousPoints = []
    audioLevelHistory = []
    
    // 不继续请求动画帧
    animationFrameId = requestAnimationFrame(draw)
    return
  }
  
  // 获取频率数据
  analyser.getByteFrequencyData(dataArray)
  
  // 生成点和计算是否应该使用模拟数据
  const { points: audioPoints, useSimulated } = generateAudioPoints(width, height, dataArray, analyser.frequencyBinCount)
  
  // 时间因子，用于模拟波形
  const time = Date.now() / 1000
  
  // 最终要绘制的点
  let finalPoints
  
  // 如果应该使用模拟数据或者之前已经在使用
  if (useSimulated && useSimulatedData) {
    // 生成模拟波形点
    const simulatedPoints = generateSimulatedPoints(width, height, time)
    // 平滑过渡
    finalPoints = smoothPoints(simulatedPoints, previousPoints, transitionFactor)
  } else {
    // 使用音频数据点，并应用平滑过渡
    finalPoints = smoothPoints(audioPoints, previousPoints, transitionFactor)
  }
  
  // 保存这一帧的点用于下一帧的平滑过渡
  previousPoints = finalPoints
  
  // 绘制曲线
  if (finalPoints.length > 0) {
    // 使用贝塞尔曲线绘制平滑曲线
    ctx.beginPath()
    ctx.moveTo(finalPoints[0].x, finalPoints[0].y)
    
    // 绘制平滑曲线
    for (let i = 0; i < finalPoints.length - 1; i++) {
      const xc = (finalPoints[i].x + finalPoints[i+1].x) / 2
      const yc = (finalPoints[i].y + finalPoints[i+1].y) / 2
      ctx.quadraticCurveTo(finalPoints[i].x, finalPoints[i].y, xc, yc)
    }
    
    // 如果有多个点，完成最后一段曲线
    if (finalPoints.length > 1) {
      const lastPoint = finalPoints[finalPoints.length - 1]
      ctx.lineTo(width, lastPoint.y)
    }
    
    // 线条渲染
    ctx.lineWidth = 3
    ctx.strokeStyle = props.color
    ctx.stroke()
    
    // 填充波形下方区域
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = `${props.color}20` // 添加透明度
    ctx.fill()
  }
  
  // 请求下一帧
  animationFrameId = requestAnimationFrame(draw)
}

// 监视 mic 属性的变化
watch(() => props.mic, (newValue) => {
  // 重置状态并重新初始化
  previousPoints = []
  audioLevelHistory = []
  useSimulatedData = true
  lastTransitionTime = 0
  
  // 重新初始化音频
  cleanup()
  initAudio()
})

// 监视 color 属性的变化，不需要重新初始化
watch(() => props.color, () => {
  // 颜色变化不影响音频处理，只影响绘制
})

// 清理函数
const cleanup = () => {
  // 取消动画
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // 停止振荡器
  if (source) {
    if (source.stop) {
      source.stop()
    }
    if (source.disconnect) {
      source.disconnect()
    }
    source = null
  }
  
  // 停止麦克风流
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  
  // 关闭音频上下文
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close()
    } catch (e) {
      console.error('关闭音频上下文失败:', e)
    }
  }
  audioContext = null
  analyser = null
}

// 组件挂载时初始化
onMounted(() => {
  initAudio()
})

// 组件卸载时清理
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.wave-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style> 