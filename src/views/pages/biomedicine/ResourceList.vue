<template>
  <v-container fluid>
    <v-card rounded="lg" variant="flat" class="text-blue-grey-darken-3 mb-5 mt-5">
      <div class="d-flex flex-wrap align-center pa-4">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" color="primary" class="mr-2">
              <v-icon class="mr-2">mdi-calendar-month</v-icon>
              {{ filterList.find(f => f.value === filterType)?.title }}
              <v-icon class="ml-1">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="item in filterList"
              :key="item.value"
              @click="filterType = item.value"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" color="primary" class="mr-4">
              <v-icon class="mr-2">mdi-sort</v-icon>
              {{ sortList.find(s => s.value === sortOrder)?.title }}
              <v-icon class="ml-1">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="item in sortList"
              :key="item.value"
              @click="sortOrder = item.value"
            >
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          icon
          variant="text"
          color="primary"
          @click="fetchResources"
          :loading="loading"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>

        <v-spacer></v-spacer>
        <div style="width: 350px">
          <v-text-field
            v-model="search"
            color="primary"
            variant="outlined"
            hide-details
            density="compact"
            filled
            rounded
            placeholder="搜索资源标题、作者或内容..."
            clearable
          >
            <template v-slot:prepend-inner>
              <v-icon>mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </div>
      </div>
    </v-card>

    <v-sheet>
        <ResourceCardList :resources="filteredList" />

        <v-overlay :model-value="loading" class="align-center justify-center">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </v-overlay>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ResourceCardList from '@/views/pages/biomedicine/ResourceCardList.vue'; // 确保此路径正确

// --- 1. 数据结构定义 ---
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

// --- 2. 响应式状态 ---
const allResources = ref<EduResource[]>([]);
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

// --- 3. 核心计算属性 (用于筛选和排序) ---
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

  // 搜索过滤
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    processedList = processedList.filter(item =>
      (item.title || '').toLowerCase().includes(searchLower) ||
      (item.authorName || '').toLowerCase().includes(searchLower) ||
      getPlainText(item.content).toLowerCase().includes(searchLower)
    );
  }

  // 时间范围过滤
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

  // 排序
  return processedList.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder.value === "earliest" ? dateA - dateB : dateB - dateA;
  });
});

// --- 4. API 数据获取 ---
const fetchResources = async () => {
  loading.value = true;
  try {
    // 拉取足够多的数据以模拟“全部”
    const response = await fetch('/api/edu/resources/page?pageNum=1&pageSize=999');
    if (!response.ok) throw new Error('网络请求失败');
    const result = await response.json();
    if (result.code === 20000 && result.data && result.data.records) {
      allResources.value = result.data.records;
    } else {
      console.error('获取教学资源失败:', result.msg);
      allResources.value = [];
    }
  } catch (error) {
    console.error('请求教学资源时出错:', error);
    allResources.value = [];
  } finally {
    loading.value = false;
  }
};

// --- 5. 生命周期钩子 ---
onMounted(() => {
  fetchResources();
});
</script>