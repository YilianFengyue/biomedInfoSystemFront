<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ResourceCardList from '@/views/pages/biomedicine/ResourceCardList.vue'; 

// --- 1. 数据结构定义 ---

// 图文资源原始接口
interface EduResource {
  id: number;
  title: string;
  coverImageUrl: string;
  content: string;
  authorId: number;
  authorName: string;
  status: string;
  createdAt: string;
}

// 视频资源原始接口
//【关键修改】: 为视频资源接口增加 status 字段
interface EduVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  coverUrl: string | null;
  duration: number;
  uploaderId: number;
  createdAt: string;
  uploaderName?: string;
  status: string; // 新增 status 字段
}

// 统一的、用于卡片展示的资源数据结构
interface DisplayResource {
  id: number;
  type: 'text' | 'video';
  title: string;
  coverImageUrl: string | null;
  description: string;
  authorName: string;
  createdAt: string;
  videoUrl?: string; 
  detailUrl: string; 
}


// --- 2. 响应式状态 ---
const allResources = ref<DisplayResource[]>([]); 
const loading = ref<boolean>(false);
const search = ref<string>("");

const resourceTypeFilter = ref<string>('all');
const resourceTypeList = ref([
  { title: '全部类型', value: 'all' },
  { title: '图文资源', value: 'text' },
  { title: '视频资源', value: 'video' },
]);

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

// --- 3. 核心计算属性 ---

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

  if (resourceTypeFilter.value !== 'all') {
    processedList = processedList.filter(item => item.type === resourceTypeFilter.value);
  }
  
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
    return sortOrder.value === "earliest" ? dateA - dateB : dateB - dateA;
  });
});

// --- 4. API 数据获取 ---
const fetchAllResources = async () => {
  loading.value = true;
  allResources.value = []; 

  try {
    const [textResponse, videoResponse] = await Promise.all([
      fetch('/api/edu/resources/page?pageNum=1&pageSize=999'),
      fetch('/api/videos/page?pageNum=1&pageSize=999')
    ]);

    if (!textResponse.ok) throw new Error(`获取图文资源失败: ${textResponse.status}`);
    if (!videoResponse.ok) throw new Error(`获取视频资源失败: ${videoResponse.status}`);

    const textResult = await textResponse.json();
    const videoResult = await videoResponse.json();
    
    const combinedList: DisplayResource[] = [];

    if (textResult.code === 20000 && textResult.data?.records) {
      const textResources = textResult.data.records
        .filter((res: EduResource) => res.status !== 'draft') // 过滤图文
        .map((res: EduResource): DisplayResource => ({
        id: res.id,
        type: 'text',
        title: res.title,
        coverImageUrl: res.coverImageUrl,
        description: getPlainText(res.content),
        authorName: res.authorName || '未知作者',
        createdAt: res.createdAt,
        detailUrl: `/biomedicine/resource-detail/${res.id}`, 
      }));
      combinedList.push(...textResources);
    }

    if (videoResult.code === 20000 && videoResult.data?.content) {
      const videoResources = videoResult.data.content
        .filter((vid: EduVideo) => vid.status !== 'draft') //【关键修改】: 过滤视频
        .map((vid: EduVideo): DisplayResource => ({
        id: vid.id,
        type: 'video',
        title: vid.title,
        coverImageUrl: vid.coverUrl,
        description: vid.description || '暂无简介',
        authorName: vid.uploaderName || '上传者', 
        createdAt: vid.createdAt,
        videoUrl: vid.videoUrl,
        detailUrl: `/biomedicine/VideoDetail/${vid.id}`, 
      }));
      combinedList.push(...videoResources);
    }
    
    allResources.value = combinedList;

  } catch (error) {
    console.error('请求所有资源时出错:', error);
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
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="搜索资源标题、作者或简介..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="resourceTypeFilter"
              :items="resourceTypeList"
              label="资源类型"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filterType"
              :items="filterList"
              label="发布时间"
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