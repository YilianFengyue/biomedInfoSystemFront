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

      <v-data-table
        :headers="headers"
        :items="serverItems"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :items-length="totalItems"
        @update:options="handleOptionsUpdate"
        item-value="id"
        hover
        class="elevation-0"
      >
        <template v-slot:item.composition="{ item }">
          <p class="description-cell">{{ item.raw.composition }}</p>
        </template>
        <template v-slot:item.function_effect="{ item }">
          <p class="description-cell">{{ item.raw.function_effect }}</p>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="item.raw.status === 1 ? 'green' : 'grey'" size="small" label>
            {{ item.raw.status === 1 ? '正常' : '禁用' }}
          </v-chip>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click.stop="openEditDialog(item.raw)">mdi-pencil</v-icon>
          <v-icon small color="error" @click.stop="deleteItem(item.raw)">mdi-delete</v-icon>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFormulas, type Formula, type FormulaQuery } from '@/api/formulaApi';
import { debounce } from 'lodash-es';

const itemsPerPage = ref(10);
const headers = ref([
  { title: 'ID', key: 'id', sortable: false, width: '80px' },
  { title: '方名', key: 'name', sortable: true },
  { title: '出处', key: 'source', sortable: true },
  { title: '功用', key: 'function_effect', sortable: false, width: '25%' },
  { title: '药物组成', key: 'composition', sortable: false, width: '25%' },
  { title: '状态', key: 'status', sortable: true, width: '100px' },
  { title: '操作', key: 'actions', sortable: false, align: 'center', width: '120px' },
]);

const serverItems = ref<Formula[]>([]);
const loading = ref(true);
const totalItems = ref(0);
const searchKeyword = ref('');
let currentSortBy: any[] = [];

// 核心数据加载函数
const loadItems = async ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) => {
  loading.value = true;
  currentSortBy = sortBy; // 保存排序状态

  const params: FormulaQuery = {
    page,
    per_page: itemsPerPage,
    keyword: searchKeyword.value,
  };

  // 如果需要后端排序，可以在这里添加排序参数
  // if (sortBy.length) {
  //   params.sortBy = sortBy[0].key;
  //   params.sortOrder = sortBy[0].order;
  // }
  
  const data = await getFormulas(params);
  serverItems.value = data.items;
  totalItems.value = data.total;
  loading.value = false;
};

// 表格选项更新时触发（分页、排序）
const handleOptionsUpdate = ({ page, itemsPerPage, sortBy }: { page: number, itemsPerPage: number, sortBy: any[] }) => {
  loadItems({ page, itemsPerPage, sortBy });
};

// 搜索防抖
const debouncedSearch = debounce(() => {
    loadItems({ page: 1, itemsPerPage: itemsPerPage.value, sortBy: currentSortBy });
}, 500);

// --- 占位函数，后续可以实现具体的弹窗逻辑 ---
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
  max-height: 3.2em; /* 2 lines */
  line-height: 1.6em;
}
</style>