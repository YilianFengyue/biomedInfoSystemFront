<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Herb, HerbQuery, PaginatedHerbs } from '@/api/herbApi'
import http from '@/api/http'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useProfileStore } from '@/stores/profileStore'
import { useRoute, useRouter } from 'vue-router'

// 导入一个预设的图片作为默认图
import defaultHerbImage from '@/assets/edu/new.jpg'

// --- 预览功能所需的状态 ---
const isPreviewingImage = ref(false)
const previewImageUrl = ref('')

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
  itemsPerPage: 12
})

// --- 新增：每页显示数量的选项 ---
const itemsPerPageOptions = [
  { title: '12', value: 12 },
  { title: '24', value: 24 },
  { title: '36', value: 36 },
  { title: '48', value: 48 }
]

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

const pageCount = computed(() => {
  if (!totalItems.value || options.value.itemsPerPage <= 0) return 0
  return Math.ceil(totalItems.value / options.value.itemsPerPage)
})

const showImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  isPreviewingImage.value = true
}

const fetchHerbs = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
  isFading.value = true
  setTimeout(() => (isFading.value = false), 200)

  loading.value = true
  try {
    const params: HerbQuery = {
      page,
      limit: itemsPerPage,
      ...searchParams.value
    }
    Object.keys(params).forEach((key) => {
      if (!params[key as keyof HerbQuery]) delete params[key as keyof HerbQuery]
    })

    const response = await http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params })
    const fetchedHerbs = response.data.data.records
    totalItems.value = response.data.data.total || 0

    if (fetchedHerbs && fetchedHerbs.length > 0) {
      const imagePromises = fetchedHerbs.map((herb) =>
        http.get<any>(`/herb/herbs/${herb.id}/images`).catch(() => ({ data: { data: [] } }))
      )

      const imageResults = await Promise.all(imagePromises)

      herbList.value = fetchedHerbs.map((herb, index) => {
        const images = imageResults[index]?.data?.data
        if (images && images.length > 0) {
          herb.imageUrl = images[0]
        }
        return herb
      })
    } else {
      herbList.value = []
    }
  } catch (error) {
    console.error('获取药材数据失败:', error)
    snackbarStore.showErrorMessage('数据加载失败')
  } finally {
    loading.value = false
  }
}

const performSearch = () => {
  if (options.value.page !== 1) {
    options.value.page = 1
  } else {
    fetchHerbs(options.value)
  }
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

// --- 修改：侦听整个 options 对象 ---
watch(
  options,
  (newOptions, oldOptions) => {
    // 如果是每页数量变化，则回到第一页
    if (newOptions.itemsPerPage !== oldOptions.itemsPerPage) {
      options.value.page = 1
    }
    fetchHerbs(newOptions)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  { deep: true } // 使用深度侦听
)

onMounted(() => {
  fetchHerbs(options.value)
})

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
          <v-container fluid v-if="loading" class="pa-4">
            <v-row>
              <v-col v-for="n in options.itemsPerPage" :key="n" cols="12" sm="6" md="4" lg="3">
                <v-skeleton-loader type="image, article"></v-skeleton-loader>
              </v-col>
            </v-row>
          </v-container>

          <v-container fluid v-else-if="!herbList.length">
            <div class="text-center py-16">
              <v-icon size="64" color="grey-lighten-1">mdi-database-off-outline</v-icon>
              <p class="text-h6 text-grey-darken-1 mt-4">未找到匹配的药材信息</p>
              <p class="text-body-2 text-grey">请尝试调整筛选条件或刷新。</p>
            </div>
          </v-container>

          <v-container fluid v-else class="pa-4">
            <v-row>
              <v-col v-for="item in herbList" :key="item.id" cols="12" sm="6" md="4" lg="3">
                <v-card class="d-flex flex-column" style="height: 100%" outlined hover>
                  <v-img
                    :src="item.imageUrl || defaultHerbImage"
                    height="200px"
                    cover
                    class="image-preview-avatar"
                    @click="showImagePreview(item.imageUrl || defaultHerbImage)"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="grey-lighten-4"></v-progress-circular>
                      </div>
                    </template>
                  </v-img>

                  <v-card-title class="font-weight-bold text-grey-darken-3">{{ item.name }}</v-card-title>
                  <v-card-subtitle class="pb-2">
                    <i>{{ item.scientificName || '暂无学名' }}</i>
                  </v-card-subtitle>

                  <v-card-text>
                    <div class="mb-3">
                      <v-chip size="small" class="mr-2 mb-2" label>
                        <v-icon start icon="mdi-leaf-maple"></v-icon>
                        {{ item.familyName || 'N/A' }}
                      </v-chip>
                      <v-chip size="small" class="mr-2 mb-2" label>
                        <v-icon start icon="mdi-sprout"></v-icon>
                        {{ item.lifeForm || 'N/A' }}
                      </v-chip>
                      <v-chip
                        :color="item.resourceType === '栽培' ? 'teal' : 'light-blue'"
                        size="small"
                        label
                        class="font-weight-bold mb-2"
                      >
                        {{ item.resourceType }}
                      </v-chip>
                    </div>
                    <v-tooltip location="top">
                      <template #activator="{ props }">
                        <p v-bind="props" class="description-cell text-grey-darken-1">
                          {{ item.description || '暂无描述信息。' }}
                        </p>
                      </template>
                      <span>{{ item.description || '暂无描述' }}</span>
                    </v-tooltip>
                  </v-card-text>

                  <v-spacer></v-spacer>

                  <v-divider class="mx-4"></v-divider>

                  <v-card-actions class="px-4">
                    <div class="text-caption text-grey">
                      <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                      {{ new Date(item.createdAt).toLocaleDateString() }}
                    </div>
                    <v-spacer></v-spacer>
                    <div v-if="userType === 2">
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        color="primary"
                        @click.stop="editHerb(item)"
                        title="编辑"
                      />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        size="small"
                        color="error"
                        @click.stop="deleteHerb(item)"
                        title="删除"
                      />
                    </div>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-container>

          <div class="d-flex flex-wrap justify-center align-center mt-6 pb-4" v-if="pageCount > 1">
            <v-pagination v-model="options.page" :length="pageCount" :total-visible="7" rounded="circle" class="mb-2"></v-pagination>
            
            <div style="width: 120px;" class="ml-4">
              <v-select
                v-model="options.itemsPerPage"
                :items="itemsPerPageOptions"
                density="compact"
                variant="outlined"
                hide-details
                label="每页"
              ></v-select>
            </div>
          </div>
          </div>
      </v-card>
    </v-card>

    <v-dialog v-model="isPreviewingImage" max-width="600px">
      <v-card @click="isPreviewingImage = false">
        <v-img :src="previewImageUrl" contain max-height="80vh" />
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="text" @click="isPreviewingImage = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.description-cell {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 40px;
}

.image-preview-avatar {
  cursor: pointer;
  transition: transform 0.2s ease-in-out, filter 0.2s ease;

  &:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
}
</style>