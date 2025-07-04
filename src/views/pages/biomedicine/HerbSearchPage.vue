<script setup lang="ts">
import { ref, computed, watch } from 'vue' 
import type { Herb, HerbQuery, PaginatedHerbs } from '@/api/herbApi'
import http from '@/api/http'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useProfileStore } from '@/stores/profileStore'
import { useRoute, useRouter } from 'vue-router'

// 导入一个预设的图片作为默认图
import defaultHerbImage from '@/assets/bio/Lu.jpg'; 

const route = useRoute()
const router = useRouter()
const snackbarStore = useSnackbarStore()
const profileStore = useProfileStore()

const userType = computed(() => profileStore.user?.role ?? 1)

const herbList = ref<Herb[]>([])
const totalItems = ref(0)
const loading = ref(true)
const isFading = ref(false)

const options = ref({
  page: 1,
  itemsPerPage: 10
})

const searchParams = ref({
  name: '',
  scientificName: '',
  familyName: '',
  resourceType: ''
})

const resourceTypeOptions = [
  { title: '全部', value: '' },
  { title: '野生', value: '野生' },
  { title: '栽培', value: '栽培' }
]

const baseHeaders = [
  { title: 'ID', key: 'id', align: 'start', width: '80px' },
  { title: '药材图片', key: 'imageUrl', sortable: false, align: 'center', width: '100px' }, 
  { title: '名称', key: 'name', width: '150px' },
  { title: '学名', key: 'scientificName', width: '200px' },
  { title: '科名', key: 'familyName', width: '120px' },
  { title: '资源类型', key: 'resourceType', align: 'center', width: '120px' },
  { title: '生活型', key: 'lifeForm', width: '120px' },
  { title: '描述', key: 'description' },
  { title: '创建时间', key: 'createdAt', width: '180px' }
]

const tableHeaders = computed(() => {
  if (userType.value === 2) {
    // 增加操作列的宽度以容纳两个按钮
    return [...baseHeaders, { title: '操作', key: 'actions', sortable: false, align: 'center', width: '140px' }]
  }
  return baseHeaders
})


const fetchHerbs = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
  isFading.value = true;
  setTimeout(() => (isFading.value = false), 200);

  loading.value = true;
  try {
    const params: HerbQuery = {
      page,
      limit: itemsPerPage,
      ...searchParams.value
    };
    Object.keys(params).forEach((key) => {
      if (!params[key as keyof HerbQuery]) delete params[key as keyof HerbQuery];
    });

    const response = await http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params });
    const fetchedHerbs = response.data.data.records;
    totalItems.value = response.data.data.total || 0;

    if (fetchedHerbs && fetchedHerbs.length > 0) {
      const imagePromises = fetchedHerbs.map(herb =>
        http.get<any>(`/herb/herbs/${herb.id}/images`).catch(() => ({ data: { data: [] } })) 
      );
      
      const imageResults = await Promise.all(imagePromises);

      herbList.value = fetchedHerbs.map((herb, index) => {
        const images = imageResults[index]?.data?.data;
        if (images && images.length > 0) {
          herb.imageUrl = images[0]; 
        }
        return herb;
      });
    } else {
      herbList.value = [];
    }

  } catch (error) {
    console.error('获取药材数据失败:', error);
    snackbarStore.showErrorMessage('数据加载失败');
  } finally {
    loading.value = false;
  }
};


const performSearch = () => {
  options.value.page = 1
  fetchHerbs(options.value)
}

const resetSearch = () => {
  searchParams.value = {
    name: '',
    scientificName: '',
    familyName: '',
    resourceType: ''
  }
  performSearch()
}

const editHerb = (herb: Herb) => {
  router.push(`/herbs/edit/${herb.id}`)
}

const deleteHerb = async (herb: Herb) => {
  if (!confirm(`您确定要删除药材 "${herb.name}" 吗？此操作不可撤销。`)) return
  try {
    await http.delete(`/herb/herbs/${herb.id}`)
    snackbarStore.showSuccessMessage(`药材 "${herb.name}" 删除成功`)
    fetchHerbs(options.value)
  } catch (error) {
    console.error(`删除药材 ${herb.id} 失败:`, error)
    snackbarStore.showErrorMessage('删除失败，请稍后重试')
  }
}
</script>

<template>
  <v-container fluid class="pa-md-6 pa-4">
    <v-card class="main-card" flat color="transparent">
       <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-3" color="primary" size="x-large">mdi-magnify</v-icon>
        <span class="text-h5 font-weight-bold text-grey-darken-3">药材信息检索</span>
      </v-card-title>

      <v-card class="mb-6" rounded="lg" flat border>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-medium">
              <v-icon left class="mr-2">mdi-filter-variant</v-icon>高级筛选
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="pa-2 pt-4">
                <v-col cols="12" sm="6" md="4">
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
                  />
                </v-col>
                <v-col cols="12" sm="6" md="4">
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
                  />
                </v-col>
                <v-col cols="12" sm="6" md="4">
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
                  />
                </v-col>
                <v-col cols="12" sm="6" md="4" class="mt-2">
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
                  />
                </v-col>
                <v-col cols="12" md="8" class="d-flex align-center justify-end mt-2">
                  <v-btn @click="performSearch" color="primary" variant="flat" class="mr-2">
                    <v-icon left>mdi-magnify</v-icon>搜索
                  </v-btn>
                  <v-btn @click="resetSearch" variant="outlined">
                    <v-icon left>mdi-refresh</v-icon>重置
                  </v-btn>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
      
      <v-card rounded="lg" class="table-card" flat border>
        <div class="fade-wrapper" :class="{ 'fade-in': !isFading, 'fade-out': isFading }">
          <v-data-table-server
            class="herb-table"
            v-model:items-per-page="options.itemsPerPage"
            :headers="tableHeaders"
            :items="herbList"
            :items-length="totalItems"
            :loading="loading"
            item-value="id"
            hover
            style="min-height: 500px"
            @update:options="fetchHerbs"
          >
             <template #loading>
              <div class="table-loading-overlay">
                <v-progress-circular indeterminate color="primary" size="32" />
              </div>
            </template>
            <template #no-data>
              <div class="text-center py-16">
                <v-icon size="64" color="grey-lighten-1">mdi-database-off-outline</v-icon>
                <p class="text-h6 text-grey-darken-1 mt-4">未找到匹配的药材信息</p>
                <p class="text-body-2 text-grey">请尝试调整筛选条件或刷新。</p>
              </div>
            </template>

            <template #item.imageUrl="{ item }">
              <v-avatar size="48" rounded="lg" class="my-2">
                <v-img :src="item.imageUrl || defaultHerbImage" cover>
                  <template v-slot:placeholder>
                    <v-progress-circular indeterminate size="20" color="grey-lighten-4"></v-progress-circular>
                  </template>
                </v-img>
              </v-avatar>
            </template>

             <template #item.scientificName="{ item }">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <div v-bind="props" class="scrollable-cell" style="max-width: 180px;">
                    {{ item.scientificName || '—' }}
                  </div>
                </template>
                <span>{{ item.scientificName || '暂无学名' }}</span>
              </v-tooltip>
            </template>

            <template #item.description="{ item }">
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <div v-bind="props" class="description-cell">
                    {{ item.description || '—' }}
                  </div>
                </template>
                <span>{{ item.description || '暂无描述' }}</span>
              </v-tooltip>
            </template>

            <template #item.createdAt="{ item }">
              {{ new Date(item.createdAt).toLocaleString() }}
            </template>

            <template #item.resourceType="{ item }">
              <v-chip :color="item.resourceType === '栽培' ? 'teal' : 'light-blue'" size="small" label class="font-weight-bold">
                {{ item.resourceType }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <div v-if="userType === 2" style="white-space: nowrap;">
                <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" class="mr-2" @click.stop="editHerb(item)" title="编辑" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteHerb(item)" title="删除" />
              </div>
            </template>

          </v-data-table-server>
        </div>
      </v-card>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.fade-wrapper {
  transition: opacity 0.4s ease-in-out;
  opacity: 1;
}
.fade-wrapper.fade-out {
  opacity: 0.5;
  pointer-events: none;
}
.fade-wrapper.fade-in {
  opacity: 1;
}

.table-loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.description-cell {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.scrollable-cell {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>




