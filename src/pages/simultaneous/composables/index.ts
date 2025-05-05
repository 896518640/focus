// 页面组合式函数导出
export * from './useSimultaneousTranslation';
export * from './useSaveTranslation';
export * from './useTextEffect';
export * from './useRecordingControl';
export * from './useTimer';
export * from './useWaveform';

// 重导出全局组合式函数，避免重复
export { useAiSummary } from '@/composables/useAiSummary'; 