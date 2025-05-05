import { request } from "@/http/axios"
import { 
  TingwuCreateTaskParams,
  TingwuTaskInfoResponse,
  TingwuCreateTaskResponse 
} from '@/types/api/tingwu';

/**
 * 创建任务
 * @param params 任务参数
 * @returns 任务响应
 */
export const createTask = async (params: TingwuCreateTaskParams) => {
  return request<TingwuCreateTaskResponse>({
    url: "tingwu/tasks",
    method: "post",
    data: params
  })
};

/**
 * 获取任务状态
 * @param taskId 任务ID
 * @returns 任务响应
 */
export const getTaskInfo = async (taskId: string) => {
  return request<TingwuTaskInfoResponse>({
    url: `tingwu/tasks/${taskId}`,
    method: "get"
  });
};


// 重新导出类型，以保持兼容性
export type {
  TingwuCreateTaskParams as CreateTaskParams,
  TingwuTaskInfoResponse as TaskInfoResponse,
  TingwuCreateTaskResponse as createTaskResponse
}; 