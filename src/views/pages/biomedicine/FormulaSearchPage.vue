<script setup lang="ts">
import { ref, watch } from 'vue';
import axios from 'axios'; // 引入axios

// --- 类型定义 ---
// 根据您提供的后端返回数据结构定义类型
interface Formula {
  id: number;
  name: string;
  alias: string | null;
  source: string;
  dynasty: string;
  author: string; // 根据您的 service 实现，这个字段可能在 VO 中
  functionEffect: string;
  mainTreatment: string;
}

interface PaginatedFormulas {
  records: Formula[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// --- 组件状态 ---
const formulaList = ref<Formula[]>([]);
const totalItems = ref(0);
const loading = ref(true);

// Vuetify 数据表格/分页选项
const options = ref({
  page: 1,
  itemsPerPage: 10, // 默认每页10条，与后端一致
  sortBy: [],
  groupBy: [],
  search: ''
});

// --- 筛选参数 ---
const searchParams = ref({
  keyword: '',
  source: '',
});

// --- API 调用 ---
const fetchFormulas = async () => {
  loading.value = true;
  try {
    const params = {
      page: options.value.page,
      size: options.value.itemsPerPage,
      keyword: searchParams.value.keyword,
      source: searchParams.value.source,
    };

    // 使用axios调用您的真实后端API
    const response = await axios.get('/api/formula/page', { params });

    if (response.data && response.data.code === 20000) {
      const result = response.data.data as PaginatedFormulas;
      formulaList.value = result.records;
      totalItems.value = result.total;
    } else {
      // 处理后端返回的错误信息
      console.error('获取方剂数据失败:', response.data.msg);
      formulaList.value = [];
      totalItems.value = 0;
    }
  } catch (error) {
    console.error('请求后端API时发生错误:', error);
    // 在这里可以使用您的snackbar组件显示网络错误等
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---
// 执行搜索
const performSearch = () => {
  options.value.page = 1; // 每次搜索都回到第一页
  fetchFormulas();
};

// 重置筛选条件
const resetSearch = () => {
  searchParams.value = {
    keyword: '',
    source: ''
  };
  performSearch();
};

// --- 表格配置 ---
const headers = [
  { title: '方剂名称', key: 'name', align: 'start', sortable: false, width: '15%' },
  { title: '出处', key: 'source', align: 'start', sortable: false, width: '20%' },
  { title: '功用', key: 'functionEffect', align: 'start', sortable: false, width: '20%' },
  { title: '主治', key: 'mainTreatment', align: 'start', sortable: false, width: '35%' },
  { title: '操作', key: 'actions', align: 'center', sortable: false, width: '10%' }
];

// --- 侦听器 ---
// 侦听vuetify表格选项的变化，自动触发API请求
watch(
  options,
  () => {
    fetchFormulas();
  },
  { deep: true, immediate: true } // immediate: true 保证组件加载时立即执行一次
);

</script>

<template>
  <v-container fluid class="pa-md-6 pa-4">
    <v-card class="mb-6 pa-4" rounded="lg" flat border>
      <v-row align="center">
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchParams.keyword"
            label="搜索方剂名称、主治..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @keydown.enter="performSearch"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchParams.source"
            label="按出处筛选，如: 伤寒论"
            prepend-inner-icon="mdi-book-open-variant"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @keydown.enter="performSearch"
          />
        </v-col>
        <v-col cols="12" md="4" class="text-md-right">
          <v-btn @click="resetSearch" variant="text" class="mr-2">
            <v-icon left>mdi-refresh</v-icon>重置
          </v-btn>
          <v-btn @click="performSearch" color="primary" variant="flat" elevation="2">
            <v-icon left>mdi-check</v-icon>应用筛选
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="lg" class="table-card" flat border>
      <v-data-table-server
        v-model:items-per-page="options.itemsPerPage"
        v-model:page="options.page"
        :headers="headers"
        :items="formulaList"
        :items-length="totalItems"
        :loading="loading"
        @update:options="fetchFormulas"
        class="elevation-0"
        item-value="id"
      >
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>

        <template v-slot:item.name="{ item }">
          <div class="font-weight-bold">{{ item.name }}</div>
          <div v-if="item.alias" class="text-caption text-grey-darken-1">别名: {{ item.alias }}</div>
        </template>

        <template v-slot:item.source="{ item }">
          <div>{{ item.source }}</div>
          <div class="text-caption text-grey-darken-1">{{ item.dynasty }}</div>
        </template>

        <template v-slot:item.mainTreatment="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props }">
              <p v-bind="props" class="description-cell">
                {{ item.mainTreatment }}
              </p>
            </template>
            <span>{{ item.mainTreatment }}</span>
          </v-tooltip>
        </template>
        
        <template v-slot:item.actions>
          <v-btn icon="mdi-eye-outline" variant="text" size="small" color="primary" title="查看详情"></v-btn>
          <v-btn icon="mdi-chart-line" variant="text" size="small" color="teal" title="分析"></v-btn>
        </template>
        
        <template v-slot:no-data>
           <div class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-database-off-outline</v-icon>
            <p class="text-body-1 text-grey-darken-1 mt-4">未找到匹配的方剂信息</p>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 最多显示2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}
</style>