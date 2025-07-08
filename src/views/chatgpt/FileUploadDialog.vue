<!--
* @Component: FileUploadDialog
* @Description: 文件上传对话框组件
-->
<script setup lang="ts">
import { ref, computed } from 'vue';

// Props 和 Emits
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'file-uploaded': [fileUrl: string, fileName: string, fileType: string];
}>();

// 响应式数据
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const previewUrl = ref<string>('');
const isDragOver = ref(false);

// 计算属性
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 支持的文件类型
const supportedTypes = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp'
];

const maxFileSize = 10 * 1024 * 1024; // 10MB

// 方法
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const processFile = (file: File) => {
  // 验证文件类型
  if (!supportedTypes.includes(file.type)) {
    alert('不支持的文件类型！请选择 PDF、文本、Markdown 或图片文件。');
    return;
  }

  // 验证文件大小
  if (file.size > maxFileSize) {
    alert('文件大小不能超过 10MB！');
    return;
  }

  selectedFile.value = file;
  
  // 生成预览
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    previewUrl.value = '';
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const response = await fetch('/api/oss/upload_general_file', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.code === 20000) {
      emit('file-uploaded', result.data, selectedFile.value.name, selectedFile.value.type);
      closeDialog();
    } else {
      alert('文件上传失败：' + result.msg);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('文件上传失败，请检查网络连接。');
  } finally {
    uploading.value = false;
  }
};

const closeDialog = () => {
  dialog.value = false;
  selectedFile.value = null;
  previewUrl.value = '';
  uploading.value = false;
};

const removeFile = () => {
  selectedFile.value = null;
  previewUrl.value = '';
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return 'mdi-file-pdf-box';
  if (type.includes('text')) return 'mdi-file-document';
  if (type.includes('image')) return 'mdi-file-image';
  return 'mdi-file';
};
</script>

<template>
  <v-dialog v-model="dialog" width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span class="font-weight-bold">上传文件</span>
        <v-btn icon variant="text" @click="closeDialog" :disabled="uploading">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider />
      
      <v-card-text class="pa-4">
        <!-- 文件选择区域 -->
        <div v-if="!selectedFile" 
             class="file-drop-area"
             :class="{ 'drag-over': isDragOver }"
             @drop="handleDrop"
             @dragover="handleDragOver"
             @dragleave="handleDragLeave">
          <v-icon size="48" color="primary" class="mb-2">mdi-cloud-upload</v-icon>
          <p class="text-body-1 mb-2">拖拽文件到此处或点击选择</p>
          <p class="text-caption text-medium-emphasis mb-3">
            支持 PDF、文本、Markdown、图片格式，最大 10MB
          </p>
          <v-btn color="primary" variant="outlined">
            选择文件
            <input type="file" 
                   class="file-input" 
                   @change="handleFileSelect"
                   :accept="supportedTypes.join(',')" />
          </v-btn>
        </div>

        <!-- 文件预览区域 -->
        <div v-else class="file-preview">
          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center">
              <!-- 文件图标或预览 -->
              <div class="file-preview-icon mr-3">
                <v-img v-if="previewUrl" 
                       :src="previewUrl" 
                       width="60" 
                       height="60" 
                       cover
                       class="rounded" />
                <v-icon v-else 
                        :icon="getFileIcon(selectedFile.type)" 
                        size="60" 
                        color="primary" />
              </div>
              
              <!-- 文件信息 -->
              <div class="flex-grow-1">
                <p class="text-body-1 font-weight-medium mb-1">{{ selectedFile.name }}</p>
                <p class="text-caption text-medium-emphasis">
                  {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                </p>
              </div>
              
              <!-- 删除按钮 -->
              <v-btn icon variant="text" size="small" @click="removeFile" :disabled="uploading">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog" :disabled="uploading">
          取消
        </v-btn>
        <v-btn color="primary" 
               @click="uploadFile" 
               :disabled="!selectedFile || uploading"
               :loading="uploading">
          上传并发送
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.file-drop-area {
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
  
  &.drag-over {
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-color: rgb(var(--v-theme-primary));
  }
  
  &:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-preview {
  .file-preview-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>