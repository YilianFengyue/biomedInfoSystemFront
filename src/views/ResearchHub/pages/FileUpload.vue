<!--
* @Component: 文件上传页面
* @Description: 用于上传研究相关文件
-->
<script setup lang="ts">
import { useResearchStore } from "../researchStore";
import { useSnackbarStore } from "@/stores/snackbarStore";

const researchStore = useResearchStore();
const snackbarStore = useSnackbarStore();

const files = ref<File[]>([]);
const uploading = ref(false);
const uploadedFiles = ref<any[]>([]);

// 文件选择规则
const rules = {
  required: (value: File[]) => value.length > 0 || '请选择文件',
  size: (value: File[]) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return value.every(file => file.size <= maxSize) || '文件大小不能超过50MB';
  },
  type: (value: File[]) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
    return value.every(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(ext);
    }) || '不支持的文件类型';
  }
};

// 上传文件
const uploadFiles = async () => {
  if (files.value.length === 0) {
    snackbarStore.showErrorMessage('请选择要上传的文件');
    return;
  }
  
  uploading.value = true;
  
  try {
    for (const file of files.value) {
      const fileUrl = await researchStore.uploadFile(file);
      uploadedFiles.value.push({
        name: file.name,
        size: file.size,
        url: fileUrl,
        uploadTime: new Date().toISOString()
      });
    }
    
    snackbarStore.showSuccessMessage(`成功上传 ${files.value.length} 个文件`);
    files.value = [];
  } catch (error) {
    console.error('Failed to upload files:', error);
    snackbarStore.showErrorMessage('文件上传失败');
  } finally {
    uploading.value = false;
  }
};

// 复制链接
const copyLink = (url: string) => {
  navigator.clipboard.writeText(url);
  snackbarStore.showSuccessMessage('链接已复制到剪贴板');
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 获取文件图标
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word',
    docx: 'mdi-file-word',
    xls: 'mdi-file-excel',
    xlsx: 'mdi-file-excel',
    ppt: 'mdi-file-powerpoint',
    pptx: 'mdi-file-powerpoint',
    zip: 'mdi-folder-zip',
    rar: 'mdi-folder-zip'
  };
  return icons[ext || ''] || 'mdi-file';
};
</script>

<template>
  <v-card elevation="2" class="upload-card">
    <!-- 头部工具栏 -->
    <v-toolbar flat color="transparent" class="px-4">
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon start color="primary">mdi-cloud-upload</v-icon>
        文件上传
      </v-toolbar-title>
    </v-toolbar>
    
    <v-divider></v-divider>

    <!-- 上传区域 -->
    <v-container fluid class="pa-6">
      <v-row>
        <v-col cols="12" md="6">
          <v-card elevation="0" class="upload-area">
            <v-card-text class="text-center py-12">
              <v-file-input
                v-model="files"
                :rules="[rules.required, rules.size, rules.type]"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                multiple
                prepend-icon="mdi-paperclip"
                label="选择文件"
                variant="outlined"
                class="mb-4"
              >
                <template v-slot:selection="{ fileNames }">
                  <template v-for="fileName in fileNames" :key="fileName">
                    <v-chip
                      size="small"
                      label
                      color="primary"
                      class="mr-2"
                    >
                      {{ fileName }}
                    </v-chip>
                  </template>
                </template>
              </v-file-input>
              
              <v-icon size="64" color="grey-lighten-1">mdi-cloud-upload-outline</v-icon>
              <p class="text-h6 mt-4">拖拽文件到此处或点击选择</p>
              <p class="text-caption text-grey">支持 PDF、Word、Excel、PPT、压缩包等格式</p>
              <p class="text-caption text-grey">单个文件最大 50MB</p>
              
              <v-btn
                color="primary"
                size="large"
                class="mt-4"
                @click="uploadFiles"
                :loading="uploading"
                :disabled="files.length === 0"
              >
                <v-icon start>mdi-upload</v-icon>
                上传文件
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card elevation="0">
            <v-card-title>
              <v-icon start>mdi-history</v-icon>
              最近上传
            </v-card-title>
            <v-card-text>
              <v-list v-if="uploadedFiles.length > 0">
                <v-list-item
                  v-for="(file, index) in uploadedFiles"
                  :key="index"
                  class="uploaded-item"
                >
                  <template v-slot:prepend>
                    <v-icon :color="index === 0 ? 'primary' : 'grey'">
                      {{ getFileIcon(file.name) }}
                    </v-icon>
                  </template>
                  
                  <v-list-item-title>{{ file.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatFileSize(file.size) }} · {{ formatDate(file.uploadTime) }}
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-content-copy"
                      size="small"
                      variant="text"
                      @click="copyLink(file.url)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-open-in-new"
                      size="small"
                      variant="text"
                      :href="file.url"
                      target="_blank"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              
              <div v-else class="text-center py-8">
                <v-icon size="48" color="grey-lighten-1">mdi-folder-open</v-icon>
                <p class="text-body-2 text-grey mt-2">暂无上传记录</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<style scoped lang="scss">
.upload-card {
  height: 100%;
  border-radius: 16px !important;
  overflow: hidden;
}

.upload-area {
  border: 2px dashed #e0e0e0;
  border-radius: 12px !important;
  transition: all 0.3s;
  
  &:hover {
    border-color: #667eea;
    background-color: #f9f9f9;
  }
}

.uploaded-item {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
}
</style>