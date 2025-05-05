// request-stream.ts
// 流式请求处理工具

import { requestStream } from '@/http/axios';
import type { StreamMessageHandler } from '@/types/api';

// 导出类型和函数
export default requestStream;
export type { StreamMessageHandler }; 