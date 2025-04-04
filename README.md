# Focus - 留学生课堂学习助手

Focus是一款专为留学生设计的课堂学习助手，旨在通过先进的AI语音识别和翻译技术，帮助国外留学生更好地理解课堂内容，克服语言障碍，提高学习效率。

## 项目技术栈

### 前端技术栈
- 框架：Vue3 + TypeScript
- 构建工具：Vite
- UI组件：Vant
- 样式解决方案：UnoCSS
- HTTP客户端：Axios
- 状态管理：Pinia
- 路由：Vue Router

### 后端技术栈
- 主框架：Node.js + Express + TypeScript
- 数据库：MySQL
- ORM：Prisma
- 认证：JWT
- 文件存储：本地存储/云存储
- 任务队列：Bull

## 快速开始

确保你已安装Node.js和pnpm

```bash
# 安装依赖
pnpm install

# 开发模式启动
pnpm dev

# 构建生产环境版本
pnpm build

# 预览生产环境版本
pnpm preview
```

## 项目结构

```
focus/
├── public/             # 静态资源
├── src/                # 源代码
│   ├── common/         # 公共资源
│   ├── http/           # HTTP请求封装
│   ├── layout/         # 布局组件
│   ├── pages/          # 页面组件
│   ├── pinia/          # 状态管理
│   ├── plugins/        # 插件
│   ├── router/         # 路由配置
│   ├── services/       # 服务层
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── types/              # 全局类型定义
├── .env.*              # 环境变量配置
├── index.html          # HTML模板
├── tsconfig.json       # TypeScript配置
├── vite.config.ts      # Vite配置
└── ...
```

## 核心功能

1. 用户认证系统
2. 实时语音识别系统
3. 语音转录系统
4. 多语言翻译系统
5. 课程内容总结功能
6. 历史记录管理

## 许可证

[MIT](./LICENSE)
