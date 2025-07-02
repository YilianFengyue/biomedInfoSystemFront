<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="9">
        <v-card class="pa-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-3" color="primary" size="x-large">mdi-account-circle</v-icon>
            <div>
              <h2 class="text-h5 font-weight-bold">欢迎您，{{ user.username || '用户' }}！</h2>
              <p class="text-body-2 text-grey-darken-1 mt-1">
                在这里分享您的知识与见解，为中医药的传承贡献一份力量。
              </p>
            </div>
          </v-card-title>
          <v-divider class="my-4"></v-divider>

          <v-card-text>
            <v-tabs v-model="resourceType" color="primary" grow>
              <v-tab value="text">
                <v-icon start>mdi-file-document-edit</v-icon>
                上传图文资源
              </v-tab>
              <v-tab value="video">
                <v-icon start>mdi-video-plus</v-icon>
                上传视频资源
              </v-tab>
            </v-tabs>
            <v-divider></v-divider>

            <v-window v-model="resourceType" class="mt-5">
              <v-window-item value="text">
                <v-form ref="textForm" v-model="isTextFormValid" lazy-validation>
                  <v-text-field
                    v-model="textResource.title"
                    label="图文标题"
                    variant="solo"
                    class="mb-4"
                    :rules="[rules.required]"
                  ></v-text-field>

                  <v-select
                    v-model="selectedCategory"
                    :items="categories"
                    item-title="name"
                    item-value="id"
                    label="选择分类"
                    variant="solo"
                    class="mb-4"
                    :rules="[rules.categoryRequired]"
                  ></v-select>

                  <v-file-input
                    v-model="textResource.coverImage"
                    label="上传封面图片 (推荐比例16:9)"
                    variant="solo"
                    accept="image/*"
                    prepend-icon="mdi-camera"
                    class="mb-4"
                    show-size
                    clearable
                    @change="handleCoverImageChange('text')"
                  ></v-file-input>

                  <v-img
                    v-if="textCoverPreviewUrl"
                    :src="textCoverPreviewUrl"
                    class="mb-4 rounded-lg"
                    max-height="300"
                    aspect-ratio="16/9"
                    cover
                  ></v-img>

                  <div v-if="editor" class="mb-4">
                    <EditorMenubar :editor="editor" />
                    <editor-content :editor="editor" class="editor-content-container" />
                  </div>

                  <v-btn color="success" @click="submitResource('text')" :loading="isSubmitting" :disabled="!isTextFormValid" block size="large">
                    <v-icon left>mdi-cloud-upload-outline</v-icon>
                    发布图文
                  </v-btn>
                </v-form>
              </v-window-item>

              <v-window-item value="video">
                <v-form ref="videoForm" v-model="isVideoFormValid" lazy-validation>
                   <v-text-field
                    v-model="videoResource.title"
                    label="视频标题"
                    variant="solo"
                    class="mb-4"
                    :rules="[rules.required]"
                  ></v-text-field>

                   <v-file-input
                    v-model="videoResource.coverImage"
                    label="上传视频封面 (推荐比例16:9)"
                    variant="solo"
                    accept="image/*"
                    prepend-icon="mdi-camera"
                    class="mb-4"
                    show-size
                    clearable
                    @change="handleCoverImageChange('video')"
                  ></v-file-input>
                  
                  <v-img
                    v-if="videoCoverPreviewUrl"
                    :src="videoCoverPreviewUrl"
                    class="mb-4 rounded-lg"
                    max-height="300"
                    aspect-ratio="16/9"
                    cover
                  ></v-img>

                   <v-file-input
                    v-model="videoResource.videoFile"
                    label="上传视频文件"
                    variant="solo"
                    accept="video/*"
                    prepend-icon="mdi-video"
                    class="mb-4"
                    show-size
                    clearable
                    :rules="[rules.required]"
                    @change="handleVideoFileChange"
                  ></v-file-input>
                  
                   <video 
                    v-if="videoPreviewUrl"
                    :src="videoPreviewUrl"
                    controls
                    class="w-100 rounded-lg mb-4"
                    style="max-height: 400px; background-color: #000;"
                    ></video>

                  <v-textarea
                    v-model="videoResource.description"
                    label="视频简介"
                    variant="outlined"
                    rows="3"
                  ></v-textarea>
                  
                  <v-btn color="success" @click="submitResource('video')" :loading="isSubmitting" :disabled="!isVideoFormValid" block size="large" class="mt-4">
                     <v-icon left>mdi-cloud-upload-outline</v-icon>
                    发布视频
                  </v-btn>
                </v-form>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount, onMounted } from 'vue';
import { useProfileStore } from "@/stores/profileStore";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useRouter } from 'vue-router';
import axios from 'axios';

// Tiptap Editor
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import { Image as TiptapImage } from '@tiptap/extension-image';
import EditorMenubar from "@/components/RichEditorMenubar.vue";

// --- 状态管理和路由 ---
const profileStore = useProfileStore();
const snackbarStore = useSnackbarStore();
const router = useRouter();
const user = computed(() => profileStore.user || {});

// --- 组件状态 ---
const resourceType = ref('text'); // 'text' or 'video'
const textForm = ref<any>(null);
const videoForm = ref<any>(null);
const isTextFormValid = ref(false);
const isVideoFormValid = ref(false);
const isSubmitting = ref(false);

const textCoverPreviewUrl = ref<string | null>(null);
const videoCoverPreviewUrl = ref<string | null>(null);
const videoPreviewUrl = ref<string | null>(null);

// --- 分类列表和选择状态 ---
const categories = ref([]);
const selectedCategory = ref<number | null>(null);

// 图文资源数据
const textResource = reactive({
  title: '',
  coverImage: null as File[] | null,
});

// 视频资源数据
const videoResource = reactive({
  title: '',
  description: '',
  coverImage: null as File[] | null,
  videoFile: null as File[] | null,
  duration: 0,
});

// --- Tiptap 编辑器实例 ---
const editor = useEditor({
  extensions: [StarterKit, TiptapImage],
  content: `<h2>请输入您的资源内容...</h2><p>这里支持富文本格式，您可以添加标题、列表、图片等。</p>`,
});

// --- 表单验证规则 ---
const rules = {
  required: (v: any) => !!v || '此字段为必填项',
  categoryRequired: (v: any) => v !== null || '必须选择一个分类',
};

// --- 方法 ---

// 获取分类列表的方法
const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/categories');
    if (response.data.code === 20000) {
      categories.value = response.data.data;
    } else {
      snackbarStore.showErrorMessage('获取分类列表失败');
    }
  } catch (error) {
    console.error('获取分类列表时出错:', error);
    snackbarStore.showErrorMessage('网络错误，无法获取分类列表');
  }
};


const handleCoverImageChange = (type: 'text' | 'video') => {
  const file = type === 'text' ? textResource.coverImage?.[0] : videoResource.coverImage?.[0];
  const urlRef = type === 'text' ? textCoverPreviewUrl : videoCoverPreviewUrl;
  
  if (file) {
    urlRef.value = URL.createObjectURL(file);
  } else {
    urlRef.value = null;
  }
};

const handleVideoFileChange = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if(file){
        videoPreviewUrl.value = URL.createObjectURL(file);
        // 获取视频时长
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = () => {
            window.URL.revokeObjectURL(videoElement.src);
            videoResource.duration = Math.round(videoElement.duration);
        };
        videoElement.src = URL.createObjectURL(file);
        videoResource.videoFile = [file];
    } else {
        videoPreviewUrl.value = null;
        videoResource.duration = 0;
        videoResource.videoFile = null;
    }
};

const uploadFileToOSS = async (file: File): Promise<string> => {
  if (!file) return '';
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post('/api/oss/upload_general_file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data.code === 20000 && response.data.data) {
      snackbarStore.showSuccessMessage('文件上传成功!');
      return response.data.data;
    }
    throw new Error(response.data.msg || '文件上传失败');
  } catch (error: any) {
    console.error("文件上传到OSS时出错:", error);
    const errorMessage = error.response?.data?.msg || error.message || '文件上传失败，请重试';
    snackbarStore.showErrorMessage(errorMessage);
    return '';
  }
};


const submitResource = async (type: 'text' | 'video') => {
  const currentForm = type === 'text' ? textForm.value : videoForm.value;
  const { valid } = await currentForm.validate();
  
  if (!valid) {
    snackbarStore.showWarningMessage('请完善表单信息');
    return;
  }

  isSubmitting.value = true;
  let coverImageUrl = '';
  
  const coverFile = type === 'text' ? textResource.coverImage?.[0] : videoResource.coverImage?.[0];
  if (coverFile) {
    coverImageUrl = await uploadFileToOSS(coverFile);
    if (!coverImageUrl) {
      isSubmitting.value = false;
      return;
    }
  }

  // 构建一个符合后端 ResourceUploadDto 的载荷
  let payload: any = {
    title: type === 'text' ? textResource.title : videoResource.title,
    coverImageUrl,
    authorId: user.value.id,
    status: 'published',
    resourceType: type,
  };

  if (type === 'text') {
    payload.content = editor.value?.getHTML() || '';
    payload.categoryId = selectedCategory.value;
  } else {
    // 视频类型，不需要categoryId，但需要其他字段
    payload.description = videoResource.description;
    payload.duration = videoResource.duration;
    // 为视频类型设置一个默认的categoryId，如果后端需要的话
    payload.categoryId = 0; // 或者一个默认视频分类ID

    const videoFile = videoResource.videoFile?.[0];
    if (videoFile) {
      const videoUrl = await uploadFileToOSS(videoFile);
      if (!videoUrl) {
          isSubmitting.value = false;
          return;
      }
      payload.videoUrl = videoUrl;
    }
  }
  
  try {
    const response = await axios.post('/api/edu/upload', payload);
    if (response.data.code === 20000) {
      snackbarStore.showSuccessMessage(`资源发布成功！`);
      setTimeout(() => router.push({ name: 'ResourceList' }), 1500);
    } else {
      throw new Error(response.data.msg || '发布失败');
    }
  } catch (error: any) {
    snackbarStore.showErrorMessage(error.response?.data?.msg || error.message || '发布资源时遇到未知错误');
  } finally {
    isSubmitting.value = false;
  }
};


// --- 生命周期钩子 ---
onMounted(() => {
  fetchCategories();
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

</script>

<style scoped lang="scss">
.editor-content-container {
  border: 1px solid #e0e0e0;
  border-radius: 0 0 4px 4px;
  padding: 16px;
  min-height: 300px;
  
  &:focus-within {
    border-color: #1976D2; /* Vuetify primary color */
  }

  :deep(.tiptap) {
    &:focus {
      outline: none;
    }

    p {
      line-height: 1.8;
    }

    h1, h2, h3 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
    }
  }
}
</style>