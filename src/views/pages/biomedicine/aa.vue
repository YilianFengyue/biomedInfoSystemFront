<script setup>
import { ref } from 'vue'; // 1. 从 vue 导入 ref
import { DotLottieVue } from '@lottiefiles/dotlottie-vue';

// 2. 创建一个 ref 来持有 DotLottieVue 组件的实例
const lottiePlayer = ref(null);

// 3. 创建控制动画的函数
const playAnimation = () => {
  // 检查实例是否存在，然后调用 play 方法
  lottiePlayer.value?.play();
};

const pauseAnimation = () => {
  lottiePlayer.value?.pause();
};

const stopAnimation = () => {
  // stop 方法会停止并回到动画的第一帧
  lottiePlayer.value?.stop();
};

const setSpeed = (speed) => {
  // 设置播放速度，1 是正常速度
  lottiePlayer.value?.setSpeed(speed);
};

</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Lottie 动画交互</v-card-title>
      <v-divider></v-divider>
      
      <v-card-text class="d-flex justify-center">
        <DotLottieVue 
          ref="lottiePlayer"
          style="height: 400px; width: 400px;" 
          autoplay 
          loop 
          src="/lottiefiles/animation.lottie"
        />
      </v-card-text>

      <v-card-actions class="d-flex justify-center ga-3 pa-4">
        <v-btn color="success" @click="playAnimation">
          <v-icon left>mdi-play</v-icon>
          播放
        </v-btn>
        
        <v-btn color="warning" @click="pauseAnimation">
          <v-icon left>mdi-pause</v-icon>
          暂停
        </v-btn>
        
        <v-btn color="error" @click="stopAnimation">
          <v-icon left>mdi-stop</v-icon>
          停止
        </v-btn>
      </v-card-actions>
      
      <v-card-text class="px-6">
        <v-slider
          label="速度控制"
          :min="0.5"
          :max="5"
          :step="0.5"
          thumb-label
          @update:model-value="setSpeed"
          :model-value="1"
        ></v-slider>
      </v-card-text>
    </v-card>
  </v-container>
</template>