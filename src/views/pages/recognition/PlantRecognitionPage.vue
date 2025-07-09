<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { recognizePlantApi } from '@/api/plantApi';
import { Vue3Lottie } from 'vue3-lottie';
import { useStorage } from '@vueuse/core';

// 定义历史记录的类型
interface HistoryEntry {
  id: string;
  image: string;
  topResult: string;
  timestamp: string;
  results: any[];
}

// 组件状态
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const recognitionResults = ref<any[]>([]);
const isLoading = ref(false);
const isPlant = ref(true); 
const snackbarStore = useSnackbarStore();
const isDragging = ref(false);

// 识别历史
const identificationHistory = useStorage<HistoryEntry[]>('plant-recognition-history', []);

const fileInput = ref<HTMLInputElement | null>(null);

// 清空当前状态
const resetState = () => {
  selectedFile.value = null;
  imagePreviewUrl.value = null;
  recognitionResults.value = [];
  isPlant.value = true;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 将File对象转换为Base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// 处理文件
const processFile = (file: File | null) => {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    snackbarStore.showErrorMessage('请上传正确的图片格式 (JPG, PNG, WEBP)');
    return;
  }
  resetState();
  selectedFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

// 文件选择事件
const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  processFile(target.files?.[0] as File);
};

// 拖拽事件
const onDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  processFile(event.dataTransfer?.files?.[0] as File);
};

// 识别逻辑
const handleRecognition = async () => {
  if (!selectedFile.value) {
    snackbarStore.showErrorMessage('请先选择一张图片');
    return;
  }
  isLoading.value = true;
  recognitionResults.value = [];
  isPlant.value = true;
  try {
    const response = await recognizePlantApi(selectedFile.value);
    const responseData = response.data.data;

    if (response.data.code === 20041 && responseData) {
      if (responseData.is_plant === false) {
        isPlant.value = false;
        recognitionResults.value = responseData.result || [{ name: '非植物', score: 1 }];
        snackbarStore.showWarningMessage('图片似乎不是植物哦');
      } else {
        isPlant.value = true;
        recognitionResults.value = responseData.result;
        snackbarStore.showSuccessMessage('识别成功！');
        
        // 保存到历史记录
        const imageBase64 = await toBase64(selectedFile.value);
        const newEntry: HistoryEntry = {
          id: `history-${Date.now()}`,
          image: imageBase64,
          topResult: responseData.result[0]?.name || '未知植物',
          timestamp: new Date().toLocaleString('zh-CN'),
          results: responseData.result,
        };
        identificationHistory.value.unshift(newEntry);
        if (identificationHistory.value.length > 20) {
          identificationHistory.value.pop();
        }
      }
    } else {
      throw new Error(response.data.msg || '识别失败，请稍后重试');
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.msg || error.message || '请求失败，请检查网络或联系管理员';
    snackbarStore.showErrorMessage(errorMessage);
  } finally {
    isLoading.value = false;
  }
};

// 从历史记录加载
const loadFromHistory = (entry: HistoryEntry) => {
  imagePreviewUrl.value = entry.image;
  recognitionResults.value = entry.results;
  isPlant.value = true;
  selectedFile.value = null;
  snackbarStore.showInfoMessage(`已加载历史记录：${entry.topResult}`);
};

const clearHistory = () => {
  if(confirm('确定要清空所有历史记录吗？')){
    identificationHistory.value = [];
    snackbarStore.showSuccessMessage('历史记录已清空');
  }
}
</script>

<template>
  <v-container fluid class="pa-6 bg-gradient">
    <!-- 页面标题 -->
    <div class="text-center mb-8">
      <div class="title-container">
        <v-icon size="48" class="mr-4 title-icon">mdi-camera-iris</v-icon>
        <h1 class="page-title">智能识花</h1>
      </div>
      <p class="page-subtitle">上传植物照片，即刻知晓它的名字与故事</p>
    </div>

    <v-row class="justify-center" no-gutters>
      <!-- 左侧上传卡片 -->
      <v-col cols="12" lg="5" class="pa-2">
        <v-card class="upload-main-card" elevation="8">
          <v-card-title class="card-header">
            <v-icon class="mr-2">mdi-cloud-upload</v-icon>
            图片上传
          </v-card-title>
          
          <v-card-text class="pa-4">
            <v-card
              class="upload-area"
              :class="{ 'is-dragging': isDragging }"
              @click="fileInput?.click()"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              variant="outlined"
            >
              <v-fade-transition>
                <div v-if="!imagePreviewUrl" class="upload-placeholder">
                  <Vue3Lottie
                    animationLink="https://assets7.lottiefiles.com/packages/lf20_m6a2s5kh.json"
                    :height="180"
                    :width="180"
                  />
                  <h3 class="upload-title">点击或拖拽图片到此</h3>
                  <p class="upload-subtitle">支持JPG, PNG, WEBP等格式</p>
                </div>
                <div v-else class="preview-container">
                  <v-img :src="imagePreviewUrl" class="preview-img" aspect-ratio="1" cover>
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular color="primary" indeterminate></v-progress-circular>
                      </div>
                    </template>
                  </v-img>
                  <div class="preview-overlay">
                    <v-btn variant="elevated" color="white" prepend-icon="mdi-image-edit">更换图片</v-btn>
                  </div>
                </div>
              </v-fade-transition>
            </v-card>
            
            <input ref="fileInput" type="file" accept="image/*" @change="onFileSelected" style="display: none" />
            
            <div class="mt-4">
              <v-btn 
                :loading="isLoading" 
                :disabled="!selectedFile || isLoading" 
                block 
                color="primary" 
                size="x-large" 
                @click="handleRecognition" 
                class="recognize-btn"
                variant="elevated"
                style="background: linear-gradient(135deg, #B0D183 0%, #BBC23F 100%); color: white;"
              >
                <v-icon left>mdi-magnify-scan</v-icon>
                开始识别
              </v-btn>
              <v-btn 
                v-if="selectedFile || imagePreviewUrl" 
                class="mt-3" 
                @click="resetState" 
                block 
                variant="outlined"
                color="grey"
              >
                清空当前选择
              </v-btn>
            </div>
          </v-card-text>

          <!-- 历史记录 -->
          <v-expansion-panels class="ma-4 mt-0" variant="accordion">
            <v-expansion-panel class="history-panel">
              <v-expansion-panel-title class="history-title">
                <v-icon class="mr-2">mdi-history</v-icon>
                识别历史
                <v-chip v-if="identificationHistory.length > 0" class="ml-2" color="success" size="small" style="background: #BBC23F; color: white;">
                  {{ identificationHistory.length }}
                </v-chip>
              </v-expansion-panel-title>
              <v-expansion-panel-text class="pa-0">
                <div v-if="identificationHistory.length === 0" class="text-center pa-4 text-grey">
                  暂无历史记录
                </div>
                <perfect-scrollbar v-else style="max-height: 200px;">
                  <v-list-item
                    v-for="entry in identificationHistory"
                    :key="entry.id"
                    @click="loadFromHistory(entry)"
                    class="history-item"
                  >
                    <template v-slot:prepend>
                      <v-avatar size="40" class="mr-3">
                        <v-img :src="entry.image" cover></v-img>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-bold">{{ entry.topResult }}</v-list-item-title>
                    <v-list-item-subtitle>{{ entry.timestamp }}</v-list-item-subtitle>
                  </v-list-item>
                </perfect-scrollbar>
                <v-divider v-if="identificationHistory.length > 0"></v-divider>
                <v-card-actions v-if="identificationHistory.length > 0">
                  <v-spacer></v-spacer>
                  <v-btn variant="text" color="error" size="small" @click="clearHistory">清空历史</v-btn>
                </v-card-actions>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>

      <!-- 右侧结果卡片 -->
      <v-col cols="12" lg="7" class="pa-2">
        <v-card class="results-main-card" elevation="8">
          <v-card-title class="card-header">
            <v-icon class="mr-2">mdi-flower</v-icon>
            识别结果
          </v-card-title>
          
          <v-card-text class="pa-0 results-content">
            <v-fade-transition>
              <div v-if="isLoading" class="loading-container">
                <Vue3Lottie
                  animationLink="https://assets1.lottiefiles.com/packages/lf20_p8bfn5to.json"
                  :height="200"
                  :width="200"
                />
                <p class="loading-text">正在玩命识别中...</p>
              </div>
              <div v-else-if="!isPlant" class="not-plant-container">
                <v-icon size="80" color="warning" class="mb-4">mdi-emoticon-confused</v-icon>
                <h3 class="not-plant-title">这似乎不是植物哦</h3>
                <p class="not-plant-subtitle">请换一张包含清晰植物主体的图片再试试吧</p>
              </div>
              <div v-else-if="recognitionResults.length > 0">
                <perfect-scrollbar style="height: 500px;">
                  <v-list class="pa-0">
                    <v-list-item
                      v-for="(item, index) in recognitionResults"
                      :key="index"
                      class="result-item"
                    >
                      <template v-slot:prepend>
                        <v-avatar size="64" class="mr-4 result-avatar">
                          <v-img :src="item.baike_info?.image_url" cover>
                            <template v-slot:placeholder>
                              <v-icon color="grey-lighten-2">mdi-flower</v-icon>
                            </template>
                          </v-img>
                        </v-avatar>
                      </template>

                      <v-list-item-title class="result-title">
                        {{ item.name }}
                        <v-chip v-if="index === 0" color="success" size="small" class="ml-2" style="background: #BBC23F; color: white;">最可能</v-chip>
                      </v-list-item-title>
                      
                      <v-list-item-subtitle class="result-confidence">
                        <span class="confidence-label">可信度</span>
                        <v-progress-linear
                          :model-value="item.score * 100"
                          color="success"
                          height="8"
                          rounded
                          class="confidence-bar"
                          style="color: #BBC23F;"
                        ></v-progress-linear>
                        <span class="confidence-value">{{ (item.score * 100).toFixed(1) }}%</span>
                      </v-list-item-subtitle>
                      
                      <p class="result-description">
                        {{ item.baike_info?.description || '暂无详细描述。' }}
                      </p>
                      
                      <template v-slot:append>
                        <v-btn
                          v-if="item.baike_info?.baike_url"
                          :href="item.baike_info.baike_url"
                          target="_blank"
                          icon="mdi-open-in-new"
                          variant="text"
                          color="primary"
                          style="color: #B0D183;"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </perfect-scrollbar>
              </div>
              <div v-else class="empty-container">
                <Vue3Lottie
                  animationLink="https://assets1.lottiefiles.com/packages/lf20_1bpq22eb.json"
                  :height="200"
                  :width="200"
                />
                <p class="empty-text">识别结果将在这里呈现</p>
              </div>
            </v-fade-transition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
.bg-gradient {
  background: #ffffff;
  min-height: 100vh;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.title-icon {
  background: linear-gradient(45deg, #B0D183, #BBC23F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #BCA881;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.page-subtitle {
  font-size: 1.1rem;
  color: #8B9B7D;
  margin-top: 8px;
}

.upload-main-card, .results-main-card {
  border-radius: 5px; /* 从16px改为8px */
  backdrop-filter: blur(10px);
  background: rgba(255,255,255,0.95);
  border: 1px solid #C1CBAD;
  box-shadow: 0 6px 24px rgba(176, 209, 131, 0.12);
}

.card-header {
  background: linear-gradient(135deg, #B0D183 0%, #BBC23F 100%);
  color: white;
  font-weight: 600;
  border-radius: 5px 5px 0 0; /* 从16px改为8px */
}

.upload-area {
  border: 2px dashed #C1CBAD;
  border-radius: 5px; /* 从12px改为6px */
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(193, 203, 173, 0.05);

  &:hover {
    border-color: #B0D183;
    background: rgba(176, 209, 131, 0.08);
    transform: translateY(-1px);
  }

  &.is-dragging {
    border-color: #BBC23F;
    border-style: solid;
    background: rgba(187, 194, 63, 0.12);
    transform: scale(1.01);
  }
}

.upload-placeholder {
  text-align: center;
  user-select: none;
  pointer-events: none;
}

.upload-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #BCA881;
  margin-bottom: 8px;
}

.upload-subtitle {
  color: #8B9B7D;
  font-size: 0.9rem;
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 5px; /* 从12px改为6px */
  overflow: hidden;

  .preview-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .preview-overlay {
    opacity: 1;
  }
}

.recognize-btn {
  font-weight: 600;
  background: linear-gradient(135deg, #B0D183 0%, #BBC23F 100%);
  box-shadow: 0 3px 12px rgba(176, 209, 131, 0.3);
  border-radius: 5px;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(176, 209, 131, 0.4);
    transform: translateY(-1px);
  }
}

.history-panel {
  border-radius: 5px; /* 从12px改为6px */
  overflow: hidden;
  border: 1px solid #C1CBAD;
}

.history-title {
  font-weight: 600;
  color: #BCA881;
}

.history-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(193, 203, 173, 0.08);
  }
}

.results-content {
  height: 580px;
  display: flex;
  flex-direction: column;
}

.loading-container, .not-plant-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.loading-text, .empty-text {
  font-size: 1.2rem;
  color: #8B9B7D;
  margin-top: 1rem;
}

.not-plant-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #BCA881;
  margin-bottom: 1rem;
}

.not-plant-subtitle {
  color: #8B9B7D;
  font-size: 1rem;
}

.result-item {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(193, 203, 173, 0.2);
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(193, 203, 173, 0.05);
  }
}

.result-avatar {
  border-radius: 5px; /* 从12px改为6px */
  box-shadow: 0 2px 8px rgba(176, 209, 131, 0.15);
}

.result-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #BCA881;
  margin-bottom: 8px;
}

.result-confidence {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.confidence-label {
  font-size: 0.85rem;
  color: #8B9B7D;
  margin-right: 12px;
  min-width: 50px;
}

.confidence-bar {
  flex: 1;
  margin-right: 12px;
  border-radius: 4px;
}

.confidence-value {
  font-weight: 600;
  color: #BBC23F;
  min-width: 50px;
  text-align: right;
}

.result-description {
  color: #7A8A6D;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 增强按钮样式 */
.v-btn {
  border-radius: 5px;
}

.v-chip {
  border-radius: 4px;
}

/* 微调卡片间距 */
.v-card-text {
  padding: 20px;
}

/* 优化滚动条 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: rgba(193, 203, 173, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(176, 209, 131, 0.3);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(176, 209, 131, 0.5);
}
</style>