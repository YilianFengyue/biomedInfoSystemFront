<template>
  <v-container fluid class="pa-md-6 pa-4">
    <v-card class="main-card" flat color="transparent">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-3" color="primary" size="x-large">mdi-magnify</v-icon>
        <span class="text-h5 font-weight-bold text-grey-darken-3">药材信息检索</span>
      </v-card-title>

      <div class="pa-4">
        <v-expansion-panels variant="accordion" class="mb-4 expansion-filter">
          <v-expansion-panel elevation="1">
            <v-expansion-panel-title class="font-weight-medium">
              <v-icon left class="mr-2">mdi-filter-variant</v-icon>
              高级筛选
            </v-expansion-panel-title>
            <v-expansion-panel-text class="bg-white">
              <v-row dense class="pa-2">
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchParams.name"
                    label="药材名称"
                    prepend-inner-icon="mdi-flower-tulip-outline"
                    variant="solo-filled"
                    density="compact"
                    flat
                    clearable
                    hide-details
                    bg-color="grey-lighten-4"
                    @keydown.enter="performSearch"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchParams.scientificName"
                    label="学名"
                    prepend-inner-icon="mdi-flask-outline"
                    variant="solo-filled"
                    density="compact"
                    flat
                    clearable
                    hide-details
                    bg-color="grey-lighten-4"
                    @keydown.enter="performSearch"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchParams.familyName"
                    label="科名"
                    prepend-inner-icon="mdi-leaf-maple"
                    variant="solo-filled"
                    density="compact"
                    flat
                    clearable
                    hide-details
                    bg-color="grey-lighten-4"
                    @keydown.enter="performSearch"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                   <v-select
                      v-model="searchParams.resourceType"
                      :items="resourceTypeOptions"
                      label="资源类型"
                      variant="solo-filled"
                      density="compact"
                      flat
                      hide-details
                      bg-color="grey-lighten-4"
                    ></v-select>
                </v-col>
                <v-col cols="12" md="8" class="d-flex align-center justify-end">
                    <v-btn @click="performSearch" color="primary" variant="flat" class="mr-2">
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
      </div>


      <v-card rounded="lg" class="table-card" flat>
        <v-data-table
          :headers="headers"
          :items="herbList"
          :loading="loading"
          :items-per-page="options.itemsPerPage"
          item-value="id"
          class="elevation-0 herb-table"
          hover
          hide-default-footer
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>

          <template v-slot:no-data>
              <div class="text-center py-16">
                  <v-icon size="64" color="grey-lighten-1">mdi-database-off-outline</v-icon>
                  <p class="text-h6 text-grey-darken-1 mt-4">未找到匹配的药材信息</p>
                  <p class="text-body-2 text-grey">请尝试调整筛选条件或刷新。</p>
              </div>
          </template>

          <template v-slot:item.description="{ item }">
             <v-tooltip location="top">
                  <template v-slot:activator="{ props }">
                      <div v-bind="props" class="description-cell">
                          {{ item.description || '—' }}
                      </div>
                  </template>
                  <span>{{ item.description || '暂无描述' }}</span>
              </v-tooltip>
          </template>

          <template v-slot:item.createdAt="{ item }">
            {{ new Date(item.createdAt).toLocaleString() }}
          </template>

          <template v-slot:item.resourceType="{ item }">
            <v-chip :color="item.resourceType === '栽培' ? 'teal' : 'light-blue'" size="small" label class="font-weight-bold">
              {{ item.resourceType }}
            </v-chip>
          </template>
        </v-data-table>
        <v-divider></v-divider>
        <div class="d-flex align-center justify-center pa-4" v-if="totalPages > 1">
          <v-pagination
            v-model="options.page"
            :length="totalPages"
            :total-visible="7"
            rounded="circle"
          ></v-pagination>
        </div>
      </v-card>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { type Herb, type HerbQuery, type PaginatedHerbs } from '@/api/herbApi';
import http from '@/api/http'; // 引入 axios 实例

// 数据表格的头部定义
const headers = [
  { title: 'ID', key: 'id', align: 'start', width: '80px' },
  { title: '名称', key: 'name' , width: '150px'},
  { title: '学名', key: 'scientificName', width: '200px' },
  { title: '科名', key: 'familyName' , width: '120px'},
  { title: '资源类型', key: 'resourceType', align: 'center', width: '120px' },
  { title: '生活型', key: 'lifeForm' , width: '120px'},
  { title: '描述', key: 'description' },
  { title: '创建时间', key: 'createdAt', width: '180px' },
];

const herbList = ref<Herb[]>([]);
const loading = ref(true);
const totalPages = ref(0);
const resourceTypeOptions = [
    { title: '全部', value: '' },
    { title: '野生', value: '野生' },
    { title: '栽培', value: '栽培' }
];

const options = ref({
  page: 1,
  itemsPerPage: 10,
});

const searchParams = ref<HerbQuery>({
  name: '',
  scientificName: '',
  familyName: '',
  resourceType: '',
});

const fetchHerbs = async () => {
  loading.value = true;
  try {
    const params: HerbQuery = {
      pageNum: options.value.page,
      pageSize: options.value.itemsPerPage,
      ...searchParams.value,
    };
    const response = await http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params });
    const paginatedData = response.data.data;

    if (paginatedData && Array.isArray(paginatedData.records)) {
      herbList.value = paginatedData.records;
      totalPages.value = paginatedData.pages;
    } else {
        useMockData();
    }
  } catch (error) {
    console.error("获取药材数据失败:", error);
    useMockData();
  } finally {
    loading.value = false;
  }
};

const useMockData = () => {
    herbList.value = [
        { id: 1, name: '人参 (模拟)', scientificName: 'Panax ginseng', familyName: '五加科', resourceType: '栽培', lifeForm: '多年生草本', description: '补气固脱，健脾益肺，宁心益智，养血生津。用于体虚欲脱，肢冷脉微，脾虚食少，肺虚喘咳，津伤口渴，内热消渴，久病虚羸，心悸失眠，阳痿宫冷。', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 2, name: '枸杞 (模拟)', scientificName: 'Lycium barbarum', familyName: '茄科', resourceType: '栽培', lifeForm: '灌木', description: '滋补肝肾，益精明目。用于虚劳精亏，腰膝酸痛，眩晕耳鸣，阳萎遗精，内热消渴，血虚萎黄，目昏不明。', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    totalPages.value = 1;
};

const performSearch = () => {
  options.value.page = 1;
  fetchHerbs();
};

const resetSearch = () => {
  searchParams.value = {
    name: '',
    scientificName: '',
    familyName: '',
    resourceType: '',
  };
  performSearch();
};

watch(() => options.value.page, fetchHerbs);

onMounted(() => {
  fetchHerbs();
});
</script>

<style scoped lang="scss">
.main-card {
  background-color: #f8f9fa; // 浅灰色背景
}

.table-card {
  border: 1px solid #e0e0e0;
}

.expansion-filter {
  .v-expansion-panel-title {
    font-size: 1.05rem;
    &:hover {
      background-color: #f5f5f5;
    }
  }
}

.herb-table {
  :deep(thead) {
    background-color: #F1F3F4;
    tr > th {
      color: #37474F !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
    }
  }

  :deep(tbody tr) {
    transition: background-color 0.2s ease-out, transform 0.2s ease-out;
    &:hover {
      background-color: #e3f2fd !important;
      transform: translateY(-2px);
    }
  }

  :deep(td) {
    border-bottom: 1px solid #eee !important;
  }
}

.description-cell {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}
</style>

