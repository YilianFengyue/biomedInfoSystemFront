<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ResourceCardList from '@/views/pages/biomedicine/ResourceCardList.vue';

// --- 1. 数据结构定义 ---

// 【修正1】: 更新接口定义，使其字段名与后端返回的驼峰命名完全匹配
interface EduVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string; // 从 video_url 修改为 videoUrl
  coverUrl: string | null; // 从 cover_url 修改为 coverUrl
  duration: number;
  uploaderId: number; // 从 uploader_id 修改为 uploaderId
  createdAt: string; // 从 created_at 修改为 createdAt
  uploaderName?: string;
}

// 用于在卡片中统一展示的数据结构 (保持不变)
interface DisplayResource {
  id: number;
  type: 'text' | 'video';
  title: string;
  coverImageUrl: string | null;
  description: string;
  authorName: string;
  createdAt: string;
  videoUrl?: string; // 视频资源专属
}

// --- 2. 响应式状态 (保持不变) ---
const allResources = ref<DisplayResource[]>([]);
const loading = ref<boolean>(false);
const search = ref<string>("");
const filterType = ref<string>('all');
const filterList = ref([
  { title: '全部时间', value: 'all' },
  { title: '今天发布', value: 'today' },
  { title: '本周发布', value: 'week' },
  { title: '本月发布', value: 'month' },
]);
const sortOrder = ref<string>('latest');
const sortList = ref([
  { title: '最新发布', value: 'latest' },
  { title: '最早发布', value: 'earliest' },
]);

// --- 3. 核心计算属性 (保持不变) ---
const getPlainText = (html: string | null | undefined): string => {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>?/gm, '');
};

const filteredList = computed(() => {
  let processedList = [...allResources.value];
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    processedList = processedList.filter(item =>
      (item.title || '').toLowerCase().includes(searchLower) ||
      (item.authorName || '').toLowerCase().includes(searchLower) ||
      getPlainText(item.description).toLowerCase().includes(searchLower)
    );
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filterType.value) {
    case "today":
      processedList = processedList.filter(item => new Date(item.createdAt) >= today);
      break;
    case "week":
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      processedList = processedList.filter(item => new Date(item.createdAt) >= weekAgo);
      break;
    case "month":
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      processedList = processedList.filter(item => new Date(item.createdAt) >= monthAgo);
      break;
  }
  return processedList.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder.value === "earliest" ? dateA - dateB : dateB - a;
  });
});

// --- 4. API 数据获取 (最终修正) ---
const fetchAllResources = async () => {
  loading.value = true;
  allResources.value = [];

  try {
    const videoResponse = await fetch('/api/videos/page?pageNum=1&pageSize=999');
    
    if (!videoResponse.ok) {
      throw new Error(`获取视频资源失败，状态码: ${videoResponse.status}`);
    }

    const videoResult = await videoResponse.json();
    
    // 【修正2】: 确保检查 `data.content`
    if (videoResult.code === 20000 && videoResult.data?.content) {
      // 【修正3】: 遍历 `data.content` 并使用正确的驼峰命名字段进行映射
      const videoResources = videoResult.data.content.map((vid: EduVideo): DisplayResource => ({
        id: vid.id,
        type: 'video',
        title: vid.title,
        coverImageUrl: vid.coverUrl, // 使用 vid.coverUrl
        description: vid.description || '暂无简介',
        authorName: vid.uploaderName || '上传者', 
        createdAt: vid.createdAt, // 使用 vid.createdAt
        videoUrl: vid.videoUrl, // 使用 vid.videoUrl
      }));
      allResources.value = videoResources;
    } else {
      throw new Error(videoResult.msg || '获取视频数据格式不正确');
    }

  } catch (error) {
    console.error('请求视频资源时出错:', error);
    allResources.value = [];
  } finally {
    loading.value = false;
  }
};

// --- 5. 生命周期钩子 ---
onMounted(() => {
  fetchAllResources();
});
</script>

<template>
  <v-container fluid>
    <v-card rounded="lg" variant="flat" class="text-blue-grey-darken-3 mb-5 mt-5">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="搜索课程标题、作者或简介..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="filterType"
              :items="filterList"
              label="筛选时间"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="sortOrder"
              :items="sortList"
              label="排序方式"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-sheet>
      <ResourceCardList :resources="filteredList" />
      <v-overlay :model-value="loading" class="align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-overlay>
    </v-sheet>
  </v-container>
</template>