<template>
  <v-container>
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey-darken-1">资源加载中...</p>
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      title="加载失败"
      :text="error"
      variant="tonal"
      class="my-5"
    >
      <template v-slot:append>
        <v-btn @click="router.back()" color="error">返回</v-btn>
      </template>
    </v-alert>

    <div v-else-if="resourceItem">
      <ResourcePreviewCard :resource="resourceItem" />

      <v-sheet rounded="lg" class="pa-4 mt-6 text-center" border>
        <v-btn @click="shareResource" color="primary" prepend-icon="mdi-share-variant" class="mx-2">
          分享
        </v-btn>
        <v-btn @click="router.back()" variant="text" class="mx-2">
          返回列表
        </v-btn>
      </v-sheet>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ResourcePreviewCard from './ResourcePreviewCard.vue';
import { useSnackbarStore } from '@/stores/snackbarStore'; // 假设您有这个store用于提示

// --- 数据接口 ---
interface ResourceDetailData {
  id: number;
  title: string;
  authorName: string;
  content: string;
  coverImageUrl: string | null;
  createdAt: string;
}

// --- setup ---
const route = useRoute();
const router = useRouter();
const snackbarStore = useSnackbarStore();

const resourceItem = ref<ResourceDetailData | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

// --- 方法 ---
const fetchResourceDetail = async () => {
  const resourceId = route.params.id; // 从URL获取ID
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(`/api/edu/resources/${resourceId}`);
    if (!response.ok) throw new Error('网络错误，无法连接到服务器。');

    const result = await response.json();
    if (result.code === 20000 && result.data) {
      // 将后端数据映射到前端接口
      const rawData = result.data;
      resourceItem.value = {
        id: rawData.id,
        title: rawData.title,
        authorName: rawData.authorName || '匿名作者', // 确保authorName有值
        content: rawData.content,
        coverImageUrl: rawData.coverImageUrl,
        createdAt: rawData.createdAt,
      };
    } else {
      throw new Error(result.msg || '无法加载资源数据');
    }
  } catch (err: any) {
    error.value = err.message || '请求失败，资源不存在或网络错误。';
    snackbarStore.showErrorMessage(error.value);
  } finally {
    loading.value = false;
  }
};

const shareResource = async () => {
  if (!resourceItem.value) return;

  const shareData = {
    title: resourceItem.value.title,
    text: `来看看这篇教学资源: ${resourceItem.value.title}`,
    url: window.location.href,
  };

  if (navigator.share) {
    await navigator.share(shareData);
  } else {
    await navigator.clipboard.writeText(window.location.href);
    snackbarStore.showSuccessMessage('页面链接已复制到剪贴板');
  }
};

// --- 生命周期 ---
onMounted(() => {
  fetchResourceDetail();
});
</script>

<style scoped>
.v-container {
  max-width: 1000px; /* 限制内容最大宽度，提升阅读体验 */
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>