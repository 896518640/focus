// 组件类型声明文件

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 首页自定义组件声明
declare module '/Users/liudongdong/Desktop/fe study/TheGreastIdea/speakflow/src/pages/home/components/RecognitionPanel.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{
    isRecording: boolean;
    status: string;
  }, {}, any>
  export default component
}

declare module '/Users/liudongdong/Desktop/fe study/TheGreastIdea/speakflow/src/pages/home/components/FeatureCard.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{
    icon: string;
    title: string;
  }, {}, any>
  export default component
}

declare module '/Users/liudongdong/Desktop/fe study/TheGreastIdea/speakflow/src/pages/home/components/ResultPanel.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{
    text: string;
  }, {}, any>
  export default component
} 