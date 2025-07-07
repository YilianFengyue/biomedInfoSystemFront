<template>
  <v-container fluid class="pa-4">
    <v-card elevation="4" rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="primary" class="mr-3" size="x-large">mdi-pill</v-icon>
        <div>
          <h2 class="text-h5 font-weight-bold">方剂数据库</h2>
          <p class="text-body-2 text-grey-darken-1 mt-1">
            系统化管理与查询中医药方剂
          </p>
        </div>
      </v-card-title>
      <v-divider></v-divider>

      <v-toolbar flat color="white" class="px-2">
          <v-text-field
            v-model="searchKeyword"
            label="搜索方剂名、出处、功用..."
            variant="solo"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            @input="debouncedSearch"
            class="mr-2"
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="tonal" @click="openAddDialog">
             <v-icon left>mdi-plus</v-icon> 添加方剂
          </v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <v-data-table-server
        :headers="headers"
        :items="serverItems"
        :loading="loading"
        :items-per-page="options.itemsPerPage"
        :items-length="totalItems"
        v-model:page="options.page"
        @update:options="loadItems"
        item-value="id"
        hover
        class="elevation-0"
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

        <template v-slot:item.functionEffect="{ item }">
          <p class="description-cell">{{ item.functionEffect }}</p>
        </template>
        <template v-slot:item.mainTreatment="{ item }">
          <p class="description-cell">{{ item.mainTreatment }}</p>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click.stop="openEditDialog(item)">mdi-pencil</v-icon>
          <v-icon small color="error" @click.stop="deleteItem(item)">mdi-delete</v-icon>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import axios from 'axios';

// --- 类型定义 ---
interface Formula {
  id: number;
  name: string;
  alias: string | null;
  source: string;
  dynasty: string;
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
const serverItems = ref<Formula[]>([]);
const loading = ref(true);
const totalItems = ref(0);
const searchKeyword = ref('');

// --- 表格与分页选项 ---
const options = ref({
  page: 1,
  itemsPerPage: 10,
  sortBy: [],
});

const headers = ref([
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: '方名', key: 'name', sortable: false },
  { title: '出处', key: 'source', sortable: false },
  { title: '功用', key: 'functionEffect', sortable: false, width: '25%' },
  { title: '主治', key: 'mainTreatment', sortable: false, width: '25%' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: '120px' },
]);

// --- API 调用 ---
const loadItems = async () => {
  loading.value = true;
  try {
    const params = {
      page: options.value.page,
      size: options.value.itemsPerPage,
      keyword: searchKeyword.value,
    };
    
    const response = await axios.get('api/formula/page', { params });
    
    if (response.data && response.data.code === 20000) {
      const result = response.data.data as PaginatedFormulas;
      serverItems.value = result.records;
      totalItems.value = result.total;
    } else {
      console.error('获取方剂数据失败:', response.data.msg);
      serverItems.value = [];
      totalItems.value = 0;
    }
  } catch (error) {
    console.error('请求后端API时发生错误:', error);
  } finally {
    loading.value = false;
  }
};

// --- 事件处理 ---
// 搜索防抖
const debouncedSearch = debounce(() => {
  options.value.page = 1; // 搜索时重置到第一页
  loadItems();
}, 500);

// --- 侦听器 ---
// 侦听选项变化（例如翻页、改变每页数量），自动加载数据
watch(
  options,
  () => {
    loadItems();
  },
  { deep: true, immediate: true }
);

// --- 占位函数 ---
const openAddDialog = () => { alert('添加方剂功能待实现'); };
const openEditDialog = (item: Formula) => { alert(`编辑方剂: ${item.name}`); };
const deleteItem = (item: Formula) => {
    if(confirm(`确定要删除方剂 "${item.name}" 吗?`)) {
        alert(`删除方剂: ${item.name} 功能待实现`);
    }
};

</script>

<style scoped>
.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3.2em;
  line-height: 1.6em;
}
</style>