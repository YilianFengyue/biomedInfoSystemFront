<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2" color="primary">mdi-magnify</v-icon>
        药材信息检索
      </v-card-title>

      <v-expansion-panels variant="accordion" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon left class="mr-2">mdi-filter-variant</v-icon>
            筛选条件
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row dense class="pa-2">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchParams.name"
                  label="药材名称"
                  prepend-inner-icon="mdi-flower-tulip-outline"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  @keydown.enter="performSearch"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchParams.scientificName"
                  label="学名"
                  prepend-inner-icon="mdi-flask-outline"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  @keydown.enter="performSearch"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchParams.familyName"
                  label="科名"
                  prepend-inner-icon="mdi-leaf-maple"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  @keydown.enter="performSearch"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                 <v-select
                    v-model="searchParams.resourceType"
                    :items="resourceTypeOptions"
                    label="资源类型"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-select>
              </v-col>
              <v-col cols="12" md="8" class="d-flex align-center justify-end">
                  <v-btn @click="performSearch" color="primary" class="mr-2">
                    <v-icon left>mdi-magnify</v-icon>
                    搜索
                  </v-btn>
                  <v-btn @click="resetSearch" variant="outlined">
                    <v-icon left>mdi-refresh</v-icon>
                    重置
                  </v-btn>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="herbList"
        :loading="loading"
        :items-per-page="options.itemsPerPage"
        item-value="id"
        class="elevation-1"
        hover
        hide-default-footer
      >
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>

        <template v-slot:item.description="{ item }">
          <div class="description-cell" :title="item.description">
            {{ item.description }}
          </div>
        </template>
        <template v-slot:item.createdAt="{ item }">
          {{ new Date(item.createdAt).toLocaleString() }}
        </template>
        <template v-slot:item.resourceType="{ item }">
          <v-chip :color="item.resourceType === '栽培' ? 'success' : 'info'" size="small" label>
            {{ item.resourceType }}
          </v-chip>
        </template>
      </v-data-table>

      <div class="d-flex align-center justify-center pa-4">
        <v-pagination
          v-model="options.page"
          :length="totalPages"
          :total-visible="7"
          rounded="circle"
        ></v-pagination>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { searchHerbsApi, type Herb, type HerbQuery, type PaginatedHerbs } from '@/api/herbApi';

// 数据表格的头部定义
const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: '名称', key: 'name' },
  { title: '学名', key: 'scientificName' },
  { title: '科名', key: 'familyName' },
  { title: '资源类型', key: 'resourceType' },
  { title: '生活型', key: 'lifeForm' },
  { title: '描述', key: 'description', width: '300px' },
  { title: '创建时间', key: 'createdAt' },
];

const herbList = ref<Herb[]>([]);
const loading = ref(true);
const totalPages = ref(0);
const resourceTypeOptions = [
    { title: '全部', value: '' },
    { title: '野生', value: '野生' },
    { title: '栽培', value: '栽培' }
];

// 分页和排序选项
const options = ref({
  page: 1,
  itemsPerPage: 10,
});

// 搜索参数
const searchParams = ref<HerbQuery>({
  name: '',
  scientificName: '',
  familyName: '',
  resourceType: '',
});

// 从服务器加载数据
const fetchHerbs = async () => {
  loading.value = true;

  const params: HerbQuery = {
    page: options.value.page,
    limit: options.value.itemsPerPage,
    ...searchParams.value,
  };

  try {
    // 后端返回的数据结构是 { code, data, msg }
    const response = await searchHerbsApi(params);
    const paginatedData = response.data.data as PaginatedHerbs;

    if (paginatedData && Array.isArray(paginatedData.records)) {
      herbList.value = paginatedData.records;
      totalPages.value = paginatedData.pages;
    } else {
        // 如果后端接口尚未实现分页，先使用模拟数据
        console.warn("后端接口尚未实现或返回格式不正确，正在使用模拟数据。");
        useMockData();
    }
  } catch (error) {
    console.error("获取药材数据失败:", error);
    useMockData(); // 加载失败时使用模拟数据
  } finally {
    loading.value = false;
  }
};

// 使用模拟数据 (仅用于后端未就绪时)
const useMockData = () => {
    herbList.value = [
        { id: 1, name: '人参 (模拟)', scientificName: 'Panax ginseng', familyName: '五加科', resourceType: '栽培', lifeForm: '多年生草本', description: '补气固脱，健脾益肺。', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, name: '枸杞 (模拟)', scientificName: 'Lycium barbarum', familyName: '茄科', resourceType: '栽培', lifeForm: '灌木', description: '滋补肝肾，益精明目。', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    totalPages.value = 1;
};

// 执行搜索
const performSearch = () => {
  options.value.page = 1; // 每次搜索都重置到第一页
  fetchHerbs();
};

// 重置搜索条件
const resetSearch = () => {
  searchParams.value = {
    name: '',
    scientificName: '',
    familyName: '',
    resourceType: '',
  };
  performSearch();
};

// 监听分页变化
watch(() => options.value.page, fetchHerbs);

// 组件挂载时首次加载数据
onMounted(() => {
  fetchHerbs();
});
</script>

<style scoped>
.description-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
</style>

