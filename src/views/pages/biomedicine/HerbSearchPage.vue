<template>
  <v-container
    fluid
    class="pa-md-6 pa-4"
  >
    <v-card
      class="main-card"
      flat
      color="transparent"
    >
      <v-card-title class="d-flex align-center pa-4">
        <v-icon
          class="mr-3"
          color="primary"
          size="x-large"
        >mdi-magnify</v-icon>
        <span class="text-h5 font-weight-bold text-grey-darken-3">药材信息检索</span>
      </v-card-title>

      <v-card
        class="mb-6"
        rounded="lg"
        flat
        border
      >
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-medium">
              <v-icon
                left
                class="mr-2"
              >mdi-filter-variant</v-icon>
              高级筛选
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row
                dense
                class="pa-2"
              >
                <v-col
                  cols="12"
                  md="4"
                >
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
                <v-col
                  cols="12"
                  md="4"
                >
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
                <v-col
                  cols="12"
                  md="4"
                >
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
                <v-col
                  cols="12"
                  md="4"
                  class="mt-2"
                >
                  <v-select
                    v-model="searchParams.resourceType"
                    :items="resourceTypeOptions"
                    label="资源类型"
                    variant="solo-filled"
                    density="compact"
                    flat
                    hide-details
                    bg-color="grey-lighten-4"
                    @click:clear="performSearch"
                    @update:model-value="performSearch"
                  ></v-select>
                </v-col>
                <v-col
                  cols="12"
                  md="8"
                  class="d-flex align-center justify-end mt-2"
                >
                  <v-btn
                    @click="performSearch"
                    color="primary"
                    variant="flat"
                    class="mr-2"
                  >
                    <v-icon left>mdi-magnify</v-icon>
                    搜索
                  </v-btn>
                  <v-btn
                    @click="resetSearch"
                    variant="outlined"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    重置
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>

      <v-card
        rounded="lg"
        class="table-card"
        flat
        border
      >
        <v-data-table-server
          v-model:items-per-page="options.itemsPerPage"
          :headers="tableHeaders"
          :items="herbList"
          :items-length="totalItems"
          :loading="loading"
          item-value="id"
          class="elevation-0 herb-table"
          hover
          @update:options="fetchHerbs"
        >
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
          <template v-slot:no-data>
            <div class="text-center py-16">
              <v-icon
                size="64"
                color="grey-lighten-1"
              >mdi-database-off-outline</v-icon>
              <p class="text-h6 text-grey-darken-1 mt-4">未找到匹配的药材信息</p>
              <p class="text-body-2 text-grey">请尝试调整筛选条件或刷新。</p>
            </div>
          </template>
          <template v-slot:item.description="{ item }">
            <v-tooltip location="top">
              <template v-slot:activator="{ props }">
                <div
                  v-bind="props"
                  class="description-cell"
                >
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
            <v-chip
              :color="item.resourceType === '栽培' ? 'teal' : 'light-blue'"
              size="small"
              label
              class="font-weight-bold"
            >
              {{ item.resourceType }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <div v-if="userType === 2">
              <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" class="mr-2" @click="editHerb(item)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteHerb(item)"></v-btn>
            </div>
          </template>
          
        </v-data-table-server>
        
      </v-card>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { Herb, HerbQuery, PaginatedHerbs } from "@/api/herbApi";
import http from "@/api/http";
import { useSnackbarStore } from "@/stores/snackbarStore";
import { useProfileStore } from "@/stores/profileStore";
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();

// --- 状态管理 ---
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();

const userType = computed(() => profileStore.user?.role ?? 1);

// --- 数据表格与分页 ---
const baseHeaders = [
  { title: "ID", key: "id", align: "start", width: "80px" },
  { title: "名称", key: "name", width: "150px" },
  { title: "学名", key: "scientificName", width: "200px" },
  { title: "科名", key: "familyName", width: "120px" },
  { title: "资源类型", key: "resourceType", align: "center", width: "120px" },
  { title: "生活型", key: "lifeForm", width: "120px" },
  { title: "描述", key: "description" },
  { title: "创建时间", key: "createdAt", width: "180px" },
];

const tableHeaders = computed(() => {
  if (userType.value === 2) { // 如果是教师
    return [
      ...baseHeaders,
      { title: '操作', key: 'actions', sortable: false, align: 'center', width: '120px' }
    ];
  }
  return baseHeaders;
});

const herbList = ref<Herb[]>([]);
const loading = ref(true);
const totalItems = ref(0); 

const options = ref({
  page: 1,
  itemsPerPage: 10,
});

const searchParams = ref({
  name: "",
  scientificName: "",
  familyName: "",
  resourceType: "",
});

const resourceTypeOptions = [
  { title: "全部", value: "" },
  { title: "野生", value: "野生" },
  { title: "栽培", value: "栽培" },
];

// --- API 调用 ---
const fetchHerbs = async ({ page, itemsPerPage }: { page: number, itemsPerPage: number }) => {
  loading.value = true;
  try {
    const params: HerbQuery = {
      page: page,
      limit: itemsPerPage,
      ...searchParams.value,
    };
    Object.keys(params).forEach((key) => {
      if (!params[key as keyof HerbQuery]) {
        delete params[key as keyof HerbQuery];
      }
    });

    const response = await http.get<{ data: PaginatedHerbs }>("/herb/herbs", {
      params,
    });
    const paginatedData = response.data.data;

    if (paginatedData && Array.isArray(paginatedData.records)) {
      herbList.value = paginatedData.records;
      totalItems.value = paginatedData.total || 0; 
    }
  } catch (error) {
    console.error("获取药材数据失败:", error);
    snackbarStore.showErrorMessage("数据加载失败");
  } finally {
    loading.value = false;
  }
};

// --- 搜索与重置 ---
const performSearch = () => {
  options.value.page = 1; 
  fetchHerbs(options.value);
};

const resetSearch = () => {
  searchParams.value = {
    name: "",
    scientificName: "",
    familyName: "",
    resourceType: "",
  };
  performSearch();
};

// --- 【修改】操作按钮的点击事件处理函数 ---
// 【修改】实现 editHerb 函数的跳转逻辑
const editHerb = (herb: Herb) => {
  // 使用 router.push 进行页面跳转，并带上药材的ID
  router.push(`/herbs/edit/${herb.id}`);
};

const deleteHerb = async (herb: Herb) => {
  // 1. 弹出确认框，提供更好的用户体验
  if (!confirm(`您确定要删除药材 "${herb.name}" 吗？此操作不可撤销。`)) {
    return; // 如果用户点击“取消”，则什么都不做
  }

  // 2. 尝试向后端发送删除请求
  try {
    // 【关键】发送真正的 HTTP DELETE 请求
    await http.delete(`/herb/herbs/${herb.id}`);
    
    // 3. 成功后，显示成功提示
    snackbarStore.showSuccessMessage(`药材 "${herb.name}" 删除成功`);
    
    // 4. 重新加载当前页的数据，刷新表格
    fetchHerbs(options.value);

  } catch (error) {
    // 5. 如果失败，打印错误日志并向用户显示错误提示
    console.error(`删除药材 ${herb.id} 失败:`, error);
    snackbarStore.showErrorMessage("删除失败，请稍后重试");
  }
};

</script>

<style scoped lang="scss">
.main-card {
  background-color: #f8f9fa;
}

.table-card {
  border: 1px solid #e0e0e0;
}

.herb-table {
  :deep(thead) {
    background-color: #f1f3f4;
    tr > th {
      color: #37474f !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
    }
  }

  :deep(tbody tr) {
    transition: background-color 0.2s ease-out;
    &:hover {
      background-color: #e3f2fd !important;
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
