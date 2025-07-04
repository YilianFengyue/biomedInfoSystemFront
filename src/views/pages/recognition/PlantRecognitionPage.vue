<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { recognizePlantApi } from '@/api/plantApi';
import { Vue3Lottie } from 'vue3-lottie';
import { useStorage } from '@vueuse/core';

// 定义历史记录的类型
interface HistoryEntry {
  id: string;
  image: string; // 使用base64存储图片预览
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

// ---- 新增功能：识别历史 ----
// 使用@vueuse/core的useStorage，方便地实现与localStorage的响应式同步
const identificationHistory = useStorage<HistoryEntry[]>('plant-recognition-history', []);
// -----------------------------

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

// 将File对象转换为Base64，用于历史记录存储
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });


// 辅助函数：处理文件
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


// ---- 修改：识别逻辑，增加历史记录保存 ----
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
        
        // --- 新增：保存到历史记录 ---
        const imageBase64 = await toBase64(selectedFile.value);
        const newEntry: HistoryEntry = {
          id: `history-${Date.now()}`,
          image: imageBase64,
          topResult: responseData.result[0]?.name || '未知植物',
          timestamp: new Date().toLocaleString('zh-CN'),
          results: responseData.result,
        };
        identificationHistory.value.unshift(newEntry); // 添加到数组开头
        // 保持最多20条历史记录
        if (identificationHistory.value.length > 20) {
          identificationHistory.value.pop();
        }
        // -------------------------
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

// ---- 新增功能：从历史记录加载 ----
const loadFromHistory = (entry: HistoryEntry) => {
  imagePreviewUrl.value = entry.image;
  recognitionResults.value = entry.results;
  isPlant.value = true; // 假设历史记录都是植物
  selectedFile.value = null; // 从历史加载时，不保留文件对象
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
  <v-container fluid class="pa-md-6 pa-4">
    <div class="page-header">
      <h1 class="page-title text-h4 font-weight-bold d-flex align-center">
        <v-icon size="40" class="mr-4" color="teal">mdi-camera-iris</v-icon>
        <span>智能识花</span>
      </h1>
      <p class="page-subtitle text-body-1 text-grey-darken-1 mt-2">
        上传植物照片，即刻知晓它的名字与故事
      </p>
    </div>

    <v-row class="mt-4">
      <v-col cols="12" md="5">
        <v-card
          class="upload-card pa-2"
          :class="{ 'is-dragging': isDragging }"
          @click="fileInput?.click()"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          variant="outlined"
        >
          <v-fade-transition hide-on-leave>
            <div v-if="!imagePreviewUrl" class="upload-placeholder">
              <Vue3Lottie
                animationLink="https://assets7.lottiefiles.com/packages/lf20_m6a2s5kh.json"
                :height="200"
                :width="200"
              />
              <p class="text-h6 text-grey-darken-2 font-weight-medium">点击或拖拽图片到此</p>
              <p class="text-caption text-grey">支持JPG, PNG, WEBP等格式</p>
            </div>
            <div v-else class="preview-container">
              <v-img :src="imagePreviewUrl" class="preview-img" aspect-ratio="1" cover>
                 <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                  </div>
                </template>
              </v-img>
              <div class="preview-overlay">
                <v-btn variant="tonal" size="large" prepend-icon="mdi-image-edit-outline">更换图片</v-btn>
              </div>
            </div>
          </v-fade-transition>
        </v-card>
        
        <input ref="fileInput" type="file" accept="image/*" @change="onFileSelected" style="display: none" />
        
        <div class="mt-4">
          <v-btn :loading="isLoading" :disabled="!selectedFile || isLoading" block color="teal" size="x-large" @click="handleRecognition" class="recognize-button">
            <v-icon left>mdi-magnify-scan</v-icon>
            开始识别
          </v-btn>
          <v-btn v-if="selectedFile || imagePreviewUrl" class="mt-3" @click="resetState" block variant="text">
            清空当前选择
          </v-btn>
        </div>
        
        <v-expansion-panels class="mt-6" variant="accordion">
            <v-expansion-panel>
                <v-expansion-panel-title class="font-weight-medium">
                    <v-icon class="mr-2">mdi-history</v-icon>
                    识别历史
                     <v-chip v-if="identificationHistory.length > 0" class="ml-2" color="teal" size="small" label>{{ identificationHistory.length }}</v-chip>
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
                            link
                            lines="two"
                        >
                            <template v-slot:prepend>
                                <v-avatar size="40" rounded="sm" class="mr-3">
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

      </v-col>

      <v-col cols="12" md="7">
        <v-card class="results-card" variant="outlined" min-height="600">
           <v-fade-transition hide-on-leave>
             <div v-if="isLoading" class="d-flex flex-column justify-center align-center fill-height pa-4">
                <Vue3Lottie
                animationLink="https://assets1.lottiefiles.com/packages/lf20_p8bfn5to.json"
                :height="250"
                :width="250"
                />
                <p class="mt-4 text-h6 text-grey-darken-1">正在玩命识别中...</p>
            </div>
            <div v-else class="fill-height">
              <div v-if="!isPlant" class="d-flex flex-column justify-center align-center fill-height pa-4 text-center">
                <v-icon size="80" color="orange-lighten-2" class="mb-4">mdi-emoticon-confused-outline</v-icon>
                <h3 class="text-h5 font-weight-medium">这似乎不是植物哦</h3>
                <p class="text-body-1 text-grey-darken-1 mt-2">请换一张包含清晰植物主体的图片再试试吧。</p>
              </div>

              <div v-else-if="recognitionResults.length > 0" class="fill-height">
                <h3 class="text-h6 pa-4 font-weight-medium">识别结果</h3>
                <v-divider></v-divider>
                <perfect-scrollbar style="height: calc(100% - 65px);">
                  <v-list lines="three" class="pa-0">
                    <v-list-item
                      v-for="(item, index) in recognitionResults"
                      :key="index"
                      class="result-item"
                    >
                      <template v-slot:prepend>
                        <v-avatar size="64" rounded="lg" class="mr-4">
                           <v-img :src="item.baike_info?.image_url" cover>
                            <template v-slot:placeholder>
                                <v-icon color="grey-lighten-2">mdi-flower</v-icon>
                            </template>
                           </v-img>
                        </v-avatar>
                      </template>

                      <v-list-item-title class="text-h6 font-weight-bold mb-1 d-flex align-center">
                        {{ item.name }}
                        <v-chip v-if="index === 0" color="light-green" size="small" label class="ml-3 font-weight-bold">最可能</v-chip>
                      </v-list-item-title>
                      <v-list-item-subtitle class="d-flex align-center mb-2">
                        <span class="font-weight-medium mr-2 text-caption text-grey-darken-1">可信度</span>
                        <v-progress-linear
                          :model-value="item.score * 100"
                          color="light-green"
                          height="8"
                          rounded
                          class="flex-grow-1"
                        ></v-progress-linear>
                        <span class="font-weight-bold text-light-green-darken-2 ml-3" style="min-width: 45px; text-align: right;">{{ (item.score * 100).toFixed(1) }}%</span>
                      </v-list-item-subtitle>
                      <p class="text-body-2 text-grey-darken-3 description-text">
                        {{ item.baike_info?.description || '暂无详细描述。' }}
                      </p>
                       <template v-slot:append>
                        <v-btn
                          v-if="item.baike_info?.baike_url"
                          :href="item.baike_info.baike_url"
                          target="_blank"
                          icon="mdi-open-in-new"
                          variant="text"
                          color="grey"
                          title="查看百科详情"
                        ></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </perfect-scrollbar>
              </div>
              <div v-else class="d-flex flex-column justify-center align-center fill-height pa-4">
                <Vue3Lottie
                    animationLink="https://assets1.lottiefiles.com/packages/lf20_1bpq22eb.json"
                    :height="280"
                    :width="280"
                />
                <p class="text-h6 text-grey-darken-1">识别结果将在这里呈现</p>
              </div>
            </div>
          </v-fade-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
// 页面标题区
.page-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

// 上传卡片
.upload-card {
  border: 2px dashed #d0d0d0;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: #fafcff;
  cursor: pointer;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &:hover {
    border-color: #4db6ac; /* teal lighten-2 */
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
  
  &.is-dragging {
    border-color: #00796b; /* teal darken-2 */
    border-style: solid;
    background-color: #e0f2f1; /* teal lighten-5 */
    transform: scale(1.02);
  }
}

.upload-placeholder {
  text-align: center;
  user-select: none;
  pointer-events: none;
}

// 预览容器
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: inherit;

  .preview-img {
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .preview-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    .preview-img {
      transform: scale(1.05);
    }
    .preview-overlay {
      opacity: 1;
    }
  }
}

// 识别按钮
.recognize-button {
  font-weight: bold;
  letter-spacing: 0.5px;
  transition: all 0.2s ease-in-out;
  
  &:hover {
      box-shadow: 0 4px 12px rgba(0, 150, 136, 0.3);
  }
}

// 结果卡片
.results-card {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.result-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 16px !important;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f7f9fc;
  }
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
  max-height: 3.2em; /* 1.6 * 2 */
  color: #616161;
}

// 确保容器高度足够
.fill-height {
    height: 100%;
}
</style>