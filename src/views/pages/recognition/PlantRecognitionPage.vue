<script setup lang="ts">
import { ref } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { recognizePlantApi } from '@/api/plantApi';
import { Vue3Lottie } from 'vue3-lottie';

// 组件状态
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const recognitionResults = ref<any[]>([]);
const isLoading = ref(false);
const isPlant = ref(true); // 新增状态，判断是否为植物
const snackbarStore = useSnackbarStore();
const isDragging = ref(false);

// 清空所有状态
const resetState = () => {
  selectedFile.value = null;
  imagePreviewUrl.value = null;
  recognitionResults.value = [];
  isPlant.value = true;
};

// 辅助函数：处理文件选择和拖拽
const processFile = (file: File) => {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    snackbarStore.showErrorMessage('请上传图片文件');
    return;
  }
  resetState(); // 选择新文件时重置所有状态
  selectedFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

// 从文件选择器获取文件
const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  processFile(target.files?.[0] as File);
};

// 从拖拽事件获取文件
const onDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
};

// 提交识别
const handleRecognition = async () => {
  if (!selectedFile.value) {
    snackbarStore.showErrorMessage('请先选择一张图片');
    return;
  }
  isLoading.value = true;
  recognitionResults.value = [];
  isPlant.value = true; // 重置isPlant状态
  try {
    const response = await recognizePlantApi(selectedFile.value);
    const responseData = response.data.data;

    if (response.data.code === 20041 && responseData) {
      // 检查is_plant字段
      if (responseData.is_plant === false) {
        isPlant.value = false;
        // 即使是非植物，也可能需要显示一些信息
        recognitionResults.value = responseData.result || [{ name: '非植物', score: 1 }];
        snackbarStore.showWarningMessage('图片似乎不是植物哦');
      } else {
        recognitionResults.value = responseData.result;
        snackbarStore.showSuccessMessage('识别成功！');
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
</script>

<template>
  <v-container>
    <div class="page-header">
      <h1 class="page-title text-h5 font-weight-bold">
        <v-icon size="32" class="mr-3">mdi-camera-iris</v-icon>
        智能识花
      </h1>
      <p class="page-subtitle text-body-1 text-grey-darken-1 mt-1">
        上传植物照片，即刻知晓它的名字与故事
      </p>
    </div>

    <v-row class="mt-4">
      <v-col cols="12" md="5">
        <v-card
          class="upload-card"
          :class="{ 'is-dragging': isDragging }"
          @click="($refs.fileInput as any).click()"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
          elevation="0"
        >
          <div v-if="!imagePreviewUrl" class="upload-placeholder">
            <Vue3Lottie
              animationLink="https://assets7.lottiefiles.com/packages/lf20_m6a2s5kh.json"
              :height="200"
              :width="200"
            />
            <p class="text-h6 text-grey-darken-2">点击或拖拽图片到此</p>
            <p class="text-caption text-grey">支持JPG, PNG, WEBP等格式</p>
          </div>
          <div v-else class="preview-container">
            <v-img :src="imagePreviewUrl" class="preview-img" aspect-ratio="1" contain>
               </v-img>
            <div class="preview-overlay">
              <v-btn variant="tonal" size="large" prepend-icon="mdi-image-edit-outline">更换图片</v-btn>
            </div>
          </div>
        </v-card>
        <input ref="fileInput" type="file" accept="image/*" @change="onFileSelected" style="display: none" />
        <div class="mt-4">
          <v-btn :loading="isLoading" :disabled="!selectedFile || isLoading" block color="success" size="x-large" @click="handleRecognition" class="recognize-button">
            <v-icon left>mdi-magnify-scan</v-icon>
            开始识别
          </v-btn>
          <v-btn v-if="selectedFile" class="mt-2" @click="resetState" block variant="text">
            清空选择
          </v-btn>
        </div>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="results-card" elevation="0" min-height="468">
          <div v-if="isLoading" class="d-flex flex-column justify-center align-center fill-height">
            <Vue3Lottie
              animationLink="https://assets1.lottiefiles.com/packages/lf20_p8bfn5to.json"
              :height="250"
              :width="250"
            />
            <p class="mt-4 text-h6 text-grey-darken-1">正在玩命识别中...</p>
          </div>

          <div v-else>
            <div v-if="!isPlant" class="pa-4 text-center">
              <v-icon size="64" color="warning" class="mb-4">mdi-alert-circle-outline</v-icon>
              <h3 class="text-h6 font-weight-medium">识别结果：{{ recognitionResults[0]?.name || '非植物' }}</h3>
              <p class="text-body-1 text-grey-darken-1 mt-2">这似乎不是一张植物图片，请尝试其他图片。</p>
            </div>

            <div v-else-if="recognitionResults.length > 0">
              <h3 class="text-h6 pa-4 font-weight-medium">识别结果:</h3>
              <v-divider></v-divider>
              <perfect-scrollbar style="max-height: 480px;">
                <v-list lines="three" class="pa-2">
                  <v-list-item
                    v-for="(item, index) in recognitionResults"
                    :key="index"
                    class="result-item"
                    variant="flat"
                  >
                     <template v-slot:prepend>
                        <v-avatar size="56" rounded="lg">
                           <v-img :src="item.baike_info?.image_url || 'https://via.placeholder.com/56'" cover>
                               </v-img>
                        </v-avatar>
                     </template>

                    <v-list-item-title class="text-h6 font-weight-bold mb-1">
                      {{ item.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="d-flex align-center mb-2">
                      <span class="font-weight-medium mr-2">可信度:</span>
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
                        icon="mdi-arrow-right"
                        variant="text"
                        color="grey"
                        title="查看百科"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </perfect-scrollbar>
            </div>

            <div v-else class="d-flex flex-column justify-center align-center fill-height">
               <Vue3Lottie
                animationLink="https://assets1.lottiefiles.com/packages/lf20_1bpq22eb.json"
                :height="280"
                :width="280"
              />
              <p class="text-h6 text-grey-darken-1">识别结果将在这里呈现</p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="scss">
// 页面标题区
.page-header {
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
  .page-title {
    color: #333;
    display: flex;
    align-items: center;
  }
}

// 上传卡片
.upload-card {
  border: 2px dashed #d0d0d0;
  transition: all 0.3s ease;
  background-color: #fafafa;
  cursor: pointer;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: #0d47a1;
    background-color: #f5f5f5;
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  &.is-dragging {
    border-color: #0d47a1;
    border-style: solid;
    background-color: #e3f2fd;
    transform: scale(1.02);
  }
}

.upload-placeholder {
  text-align: center;
  user-select: none;
}

// 预览容器
.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  padding: 8px;

  .preview-img {
    transition: transform 0.3s ease;
  }
  
  .preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
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
}

// 结果卡片
.results-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.result-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px !important;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
     background-color: #f9f9f9;
  }
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
  height: 3.2em;
  color: #616161;
}
</style>