<script setup lang="ts">
import { ref } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { recognizePlantApi } from '@/api/plantApi';

// 组件状态
const selectedFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const recognitionResults = ref<any[]>([]);
const isLoading = ref(false);
const snackbarStore = useSnackbarStore();
const isDragging = ref(false); // 用于拖拽状态

// 辅助函数：处理文件选择和拖拽
const processFile = (file: File) => {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    snackbarStore.showErrorMessage('请上传图片文件');
    return;
  }
  selectedFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
  recognitionResults.value = []; // 清空上次的结果
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
  try {
    const response = await recognizePlantApi(selectedFile.value);
    if (response.data.code === 20041 && response.data.data.result) {
      recognitionResults.value = response.data.data.result;
      snackbarStore.showSuccessMessage('识别成功！');
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

// 清空选择
const clearSelection = () => {
  selectedFile.value = null;
  imagePreviewUrl.value = null;
  recognitionResults.value = [];
};
</script>

<template>
  <v-container>
    <v-card class="overflow-hidden">
      <v-card-title class="pa-4">
        <v-icon class="mr-2" color="primary">mdi-camera-iris</v-icon>
        <span class="text-h5 font-weight-bold">百度AI植物识别</span>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="5">
            <v-hover v-slot="{ isHovering, props }">
              <v-sheet
                v-bind="props"
                border
                rounded="lg"
                class="pa-4 text-center d-flex flex-column align-center justify-center upload-sheet"
                height="400"
                :class="{ 'on-hover': isHovering, 'is-dragging': isDragging }"
                @click="($refs.fileInput as any).click()"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
              >
                <div v-if="!imagePreviewUrl" class="text-center">
                  <v-icon size="80" color="grey-lighten-1">mdi-image-plus-outline</v-icon>
                  <p class="text-h6 text-grey mt-4">点击或拖拽图片到此处</p>
                  <p class="text-caption text-grey">支持JPG, PNG, WEBP等格式</p>
                </div>
                <div v-else class="preview-container">
                  <img :src="imagePreviewUrl" class="preview-img" alt="图片预览" />
                  <v-fade-transition>
                    <div v-if="isHovering" class="overlay-actions d-flex align-center justify-center">
                      <v-btn variant="outlined" prepend-icon="mdi-image-edit-outline">更换图片</v-btn>
                    </div>
                  </v-fade-transition>
                </div>
              </v-sheet>
            </v-hover>
            <input ref="fileInput" type="file" accept="image/*" @change="onFileSelected" style="display: none" />
            <div class="mt-4">
              <v-btn :loading="isLoading" :disabled="!selectedFile || isLoading" block color="success" size="large" @click="handleRecognition">
                <v-icon left>mdi-magnify-scan</v-icon>
                开始识别
              </v-btn>
              <v-btn v-if="selectedFile" class="mt-2" @click="clearSelection" block variant="tonal">
                清空选择
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="7">
            <v-sheet border rounded="lg" class="pa-4" height="100%" min-height="400">
              <div v-if="isLoading" class="d-flex flex-column justify-center align-center h-100">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4 text-grey">正在玩命识别中...</p>
              </div>
              <v-scroll-x-transition group hide-on-leave>
                <div v-if="!isLoading && recognitionResults.length > 0" key="results">
                  <h3 class="text-h6 mb-3">识别结果:</h3>
                  <perfect-scrollbar style="max-height: 480px;">
                    <v-card
                      v-for="(item, index) in recognitionResults"
                      :key="index"
                      class="mb-3"
                      variant="tonal"
                      hover
                    >
                      <v-card-item>
                        <div>
                          <div class="text-h6 mb-1 font-weight-bold">
                            {{ item.name }}
                          </div>
                          <div class="text-caption mb-2">
                            <v-chip size="small" color="success" label>
                              可信度: {{ (item.score * 100).toFixed(2) }}%
                            </v-chip>
                          </div>
                          <div class="text-body-2 description-text">
                            {{ item.baike_info?.description || '暂无详细描述。' }}
                          </div>
                        </div>
                      </v-card-item>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn v-if="item.baike_info?.baike_url" :href="item.baike_info.baike_url" target="_blank" variant="text" color="info" size="small">
                          查看百科
                          <v-icon right>mdi-open-in-new</v-icon>
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </perfect-scrollbar>
                </div>
                <div v-else-if="!isLoading" key="placeholder" class="d-flex flex-column justify-center align-center h-100 text-grey">
                  <v-icon size="80">mdi-text-box-search-outline</v-icon>
                  <p class="text-h6 mt-4">识别结果将在这里显示</p>
                </div>
              </v-scroll-x-transition>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.upload-sheet {
  transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
  cursor: pointer;
  position: relative; 
  overflow: hidden; 
}

.upload-sheet.on-hover {
  background-color: #f5f5f5;
  border-color: #1976D2; 
}

.upload-sheet.is-dragging {
  background-color: #e3f2fd; 
  border-style: dashed;
  border-width: 2px;
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-img {
  max-height: 100%;
  max-width: 100%;
  border-radius: 8px;
  object-fit: contain;
}

.overlay-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  color: white;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 最多显示三行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 4.5em; /* 保证至少有三行的高度空间 */
}
</style>