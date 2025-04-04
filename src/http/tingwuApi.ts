import { request } from "./axios"

/**
 * 通义听悟API服务
 */

/**
 * 创建语音识别任务
 * @param data 任务参数
 */
export function createTask(data: {
  ossObjectKey: string
  ossBucket: string
  name?: string
  vocabularyId?: string
}) {
  return request({
    url: "/tingwu/tasks",
    method: "post",
    data
  })
}

/**
 * 获取任务信息
 * @param taskId 任务ID
 */
export function getTaskInfo(taskId: string) {
  return request({
    url: `/tingwu/tasks/${taskId}`,
    method: "get"
  })
}

/**
 * 创建热词词表
 * @param data 热词参数
 */
export function createVocabulary(data: {
  name: string
  words: string[]
}) {
  return request({
    url: "/tingwu/vocabularies",
    method: "post",
    data
  })
}
