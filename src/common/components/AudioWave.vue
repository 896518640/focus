<template>
    <div class="wave-container" :style="{ width, height }">
      <canvas ref="canvasRef"></canvas>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, onUnmounted } from 'vue'

  const props = defineProps({
    width: { type: String, default: '300px' },
    height: { type: String, default: '100px' },
    color: { type: String, default: '#00aaff' },
    mic: { type: Boolean, default: false }, // 是否启用麦克风
    smoothing: { type: Number, default: 0.85 }, // 增加平滑度
    fftSize: { type: Number, default: 1024 }  // 增加采样率
  })

  const canvasRef = ref(null)
  let audioContext = null
  let analyser = null
  let dataArray = null
  let source = null
  let animationId = null
  let fakeWaveTime = 0 // 用于模拟波形的时间变量

  async function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = props.fftSize
    analyser.smoothingTimeConstant = props.smoothing
    dataArray = new Uint8Array(analyser.frequencyBinCount)

    if (props.mic) {
      // 访问麦克风输入
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      source = audioContext.createMediaStreamSource(stream)
    } else {
      // 创建一个空音频源，但仍然连接分析器
      const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate)
      source = audioContext.createBufferSource()
      source.buffer = buffer

      console.log('source', source);
    }

    source.connect(analyser)
    drawWaveform()
  }

  // 添加粒子系统
  let particles = []
  const particleCount = 30 // 减少粒子数量

  class Particle {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.originX = x
      this.originY = y
      this.size = 1.2  // 稍微减小粒子大小
      this.alpha = 0.35  // 稍微降低透明度
      this.phase = Math.random() * Math.PI * 2
    }

    update() {
      this.phase += 0.05
      this.y = this.originY + Math.sin(this.phase) * 2.5  // 减小运动幅度
      this.alpha = 0.35 + Math.sin(this.phase) * 0.15  // 减小透明度变化范围
    }

    draw(ctx) {
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(74, 144, 226, ${this.alpha})`  // 使用更柔和的蓝色
      ctx.fill()
    }
  }

  function drawWaveform() {
    if (!canvasRef.value) return

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    // 使用 clientWidth 和 clientHeight 获取实际容器尺寸
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    function render() {
      if (props.mic) {
        analyser.getByteTimeDomainData(dataArray)
      } else {
        // 优化模拟波形
        for (let i = 0; i < dataArray.length; i++) {
          const t = fakeWaveTime + (i / dataArray.length) * Math.PI * 2
          // 组合多个正弦波，使波形更自然
          dataArray[i] = (
            Math.sin(t) * 30 +
            Math.sin(t * 2) * 15 +
            Math.sin(t * 0.5) * 25
          ) + 128
        }
        fakeWaveTime += 0.05 // 降低速度使动画更平滑
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, '#4a90e2')
      gradient.addColorStop(0.5, '#00aaff')
      gradient.addColorStop(1, '#4a90e2')

      // 绘制主波形
      ctx.beginPath()
      const sliceWidth = canvas.width / (dataArray.length - 1)
      let x = 0

      // 使用二次贝塞尔曲线使波形更平滑
      ctx.moveTo(0, canvas.height / 2)

      for (let i = 0; i < dataArray.length - 2; i++) {
        const v1 = dataArray[i] / 128.0
        const v2 = dataArray[i + 1] / 128.0

        const x1 = x
        const x2 = x + sliceWidth
        const xc = (x1 + x2) / 2

        const y1 = (v1 * canvas.height) / 2
        const y2 = (v2 * canvas.height) / 2

        ctx.quadraticCurveTo(x1, y1, xc, (y1 + y2) / 2)

        x += sliceWidth
      }

      // 波形样式
      ctx.lineWidth = 3
      ctx.strokeStyle = gradient
      ctx.stroke()

      // 添加发光效果
      ctx.shadowColor = props.color
      ctx.shadowBlur = 10
      ctx.stroke()

      // 填充波形下方区域
      const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      fillGradient.addColorStop(0, 'rgba(74, 144, 226, 0.3)')
      fillGradient.addColorStop(1, 'rgba(74, 144, 226, 0)')

      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.fillStyle = fillGradient
      ctx.fill()

      animationId = requestAnimationFrame(render)
    }

    // 重写粒子生成逻辑
    if (particles.length === 0) {
      // 每隔40个点生成一个粒子
      for (let i = 0; i < dataArray.length; i += 40) {
        const v = dataArray[i] / 128.0
        const x = (i / dataArray.length) * canvas.width
        const y = (v * canvas.height) / 2
        particles.push(new Particle(x, y))
      }
    }

    // 更新和绘制粒子
    particles.forEach(particle => {
      particle.update()
      particle.draw(ctx)
    })

      animationId = requestAnimationFrame(render)
    }


  onMounted(() => {
    initAudio()
  })

  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId)
    if (audioContext) audioContext.close()
  })
  </script>

  <style scoped lang="less">
  .wave-container {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    padding: 10px;
    transition: all 0.3s ease;
  }

  .wave-container:hover {
    transform: scale(1.01); // 减小悬停效果
    box-shadow: 0 0 15px rgba(0, 170, 255, 0.2);
  }
  </style>
