<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Herb, HerbQuery, PaginatedHerbs } from '@/api/herbApi'
import http from '@/api/http'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { useProfileStore } from '@/stores/profileStore'
import { useRouter } from 'vue-router'

// 导入一个预设的图片作为默认图
import defaultHerbImage from '@/assets/edu/new.jpg'
// 导入省份数据用于筛选
import provinces from '@/data/provinces.json'

// --- 状态管理和路由 ---
const router = useRouter()
const snackbarStore = useSnackbarStore()
const profileStore = useProfileStore()
const userType = computed(() => profileStore.user?.role ?? 1)

// --- 组件状态 ---
const herbList = ref<Herb[]>([])
const totalItems = ref(0)
const loading = ref(true)
const isFading = ref(false)

// --- 预览功能状态 ---
const isPreviewingImage = ref(false)
const previewImageUrl = ref('')

// --- Vuetify 数据表格/分页选项 ---
const options = ref({
  page: 1,
  itemsPerPage: 12
})
const itemsPerPageOptions = [
  { title: '12', value: 12 },
  { title: '24', value: 24 },
  { title: '36', value: 36 }
]

// --- 筛选参数 ---
const searchParams = ref({
  name: '',
  scientificName: '',
  resourceType: '',
  province: '',
  lifeFormStructural: '',
  lifeFormCycle: '',
  familyName: '' // 科名
})

// --- 筛选选项数据 ---
const resourceTypeOptions = [
  { title: '全部', value: '' },
  { title: '野生', value: '野生' },
  { title: '栽培', value: '栽培' }
]

const lifeFormStructuralOptions = [
  { title: '全部', value: '' },
  { title: '草本', value: '草本' },
  { title: '藤本', value: '藤本' },
  { title: '乔木', value: '乔木' },
  { title: '灌木', value: '灌木' },
]

const lifeFormCycleOptions = [
  { title: '全部', value: '' },
  { title: '一年生', value: '一年生' },
  { title: '多年生', value: '多年生' }
]

// 新增：根据数据库提取的科名选项
const familyNameOptions = [
    { title: '全部科名', value: '' },
    { title: '五加科', value: '五加科' }, { title: '茄科', value: '茄科' },
    { title: '伞形科', value: '伞形科' }, { title: '罂粟科', value: '罂粟科' },
    { title: '豆科', value: '豆科' }, { title: '凤尾蕨科', value: '凤尾蕨科' },
    { title: '中国蕨科', value: '中国蕨科' }, { title: '铁线蕨科', value: '铁线蕨科' },
    { title: '金腰蕨科', value: '金腰蕨科' }, { title: '省油茶科', value: '省油茶科' },
    { title: '鼠李科', value: '鼠李科' }, { title: '菊科', value: '菊科' },
    { title: '酢浆草科', value: '酢浆草科' }, { title: '横叶儿苗科', value: '横叶儿苗科' },
    { title: '野牡丹科', value: '野牡丹科' }, { title: '茜草科', value: '茜草科' },
    { title: '唇形科', value: '唇形科' }, { title: '居麻科', value: '居麻科' },
    { title: '本术科', value: '本术科' }, { title: '天名精科', value: '天名精科' },
    { title: '百合科', value: '百合科' }, { title: '使君子科', value: '使君子科' },
    { title: '莎草科', value: '莎草科' }, { title: '胡椒科', value: '胡椒科' },
    { title: '蔷薇科', value: '蔷薇科' }, { title: '松科', value: '松科' },
    { title: '旋花科', value: '旋花科' }, { title: '芸香科', value: '芸香科' },
    { title: '木兰科', value: '木兰科' }, { title: '玄参科', value: '玄参科' },
    { title: '虎耳草科', value: '虎耳草科' }, { title: '石竹科', value: '石竹科' },
    { title: '小檗科', value: '小檗科' }, { title: '报春花科', value: '报春花科' },
    { title: '落叶松科', value: '落叶松科' }, { title: '漆树科', value: '漆树科' },
    { title: '属科', value: '属科' }
];

const provinceItems = computed(() => [
  { name: '全部省份', value: '' },
  ...provinces.map((p) => ({ name: p.name, value: p.name }))
])

// --- 计算属性 ---
const pageCount = computed(() => {
  if (!totalItems.value || options.value.itemsPerPage <= 0) return 0
  return Math.ceil(totalItems.value / options.value.itemsPerPage)
})

// --- 方法 ---

// 显示图片预览
const showImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  isPreviewingImage.value = true
}

// 获取药材数据
const fetchHerbs = async ({ page, itemsPerPage }: { page: number; itemsPerPage: number }) => {
  isFading.value = true
  setTimeout(() => (isFading.value = false), 200)

  loading.value = true
  try {
    const lifeForms = [
      searchParams.value.lifeFormStructural,
      searchParams.value.lifeFormCycle
    ].filter(Boolean) // 使用 filter(Boolean) 过滤掉空字符串

    const params: HerbQuery = {
      page,
      limit: itemsPerPage,
      name: searchParams.value.name,
      scientificName: searchParams.value.scientificName,
      familyName: searchParams.value.familyName,
      resourceType: searchParams.value.resourceType,
      province: searchParams.value.province,
      lifeForm: lifeForms.join(','), // 合并为 "草本,多年生" 格式
    }

    // 清理掉所有值为空的参数，避免发送空字符串
    Object.keys(params).forEach((key) => {
      const K = key as keyof HerbQuery
      if (!params[K]) {
        delete params[K]
      }
    })

    const response = await http.get<{ data: PaginatedHerbs }>('/herb/herbs', { params })
    const fetchedHerbs = response.data.data.records
    totalItems.value = response.data.data.total || 0

    if (fetchedHerbs && fetchedHerbs.length > 0) {
      const imagePromises = fetchedHerbs.map((herb) =>
        http
          .get<any>(`/herb/herbs/${herb.id}/images`)
          .catch(() => ({ data: { data: [] } }))
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

// 执行搜索
const performSearch = () => {
  if (options.value.page !== 1) {
    options.value.page = 1
  } else {
    fetchHerbs(options.value)
  }
}

// 重置所有筛选条件
const resetSearch = () => {
  searchParams.value = {
    name: '',
    scientificName: '',
    resourceType: '',
    province: '',
    lifeFormStructural: '',
    lifeFormCycle: '',
    familyName: ''
  }
  performSearch()
}

// 侦听分页和每页数量的变化
watch(
  options,
  (newOptions, oldOptions) => {
    if (newOptions.itemsPerPage !== oldOptions.itemsPerPage) {
      options.value.page = 1
    }
    fetchHerbs(newOptions)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  { deep: true }
)

// 组件挂载时首次加载数据
onMounted(() => {
  fetchHerbs(options.value)
})

// 编辑和删除操作
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
    <v-card class="mb-6 pa-4" rounded="lg" flat border>
      <v-row align="center" dense>
        <v-col cols="12">
          <v-text-field
            v-model="searchParams.name"
            label="输入药材名称开始搜索..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            density="comfortable"
            flat
            clearable
            hide-details
            @keydown.enter="performSearch"
            bg-color="grey-lighten-4"
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-4">
        <v-col cols="12" sm="auto">
          <div class="filter-label">资源类型:</div>
        </v-col>
        <v-col>
          <v-chip-group v-model="searchParams.resourceType" mandatory filter color="primary">
            <v-chip v-for="item in resourceTypeOptions" :key="item.value" :value="item.value">
              {{ item.title }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
      
      <v-row dense align="center" class="mt-2">
        <v-col cols="12" sm="auto">
          <div class="filter-label">科名分类:</div>
        </v-col>
        <v-col>
          <v-select
            v-model="searchParams.familyName"
            :items="familyNameOptions"
            item-title="title"
            item-value="value"
            label="选择科名"
            variant="solo-filled"
            density="compact"
            flat
            hide-details
            clearable
            bg-color="grey-lighten-4"
          />
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="12" sm="auto">
          <div class="filter-label">结构类型:</div>
        </v-col>
        <v-col>
          <v-chip-group v-model="searchParams.lifeFormStructural" mandatory filter color="primary">
            <v-chip v-for="item in lifeFormStructuralOptions" :key="item.value" :value="item.value">
              {{ item.title }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-row dense align="center" class="mt-2">
        <v-col cols="12" sm="auto">
          <div class="filter-label">生命周期:</div>
        </v-col>
        <v-col>
          <v-chip-group v-model="searchParams.lifeFormCycle" mandatory filter color="primary">
            <v-chip v-for="item in lifeFormCycleOptions" :key="item.value" :value="item.value">
              {{ item.title }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
      
      <v-row dense align="center" class="mt-3">
        <v-col cols="12" sm="auto">
          <div class="filter-label">精确查找:</div>
        </v-col>
        
        <v-col cols="12" sm="6" md>
          <v-text-field
            v-model="searchParams.scientificName"
            label="学名"
            variant="solo-filled"
            density="compact"
            flat
            clearable
            hide-details
            bg-color="grey-lighten-4"
            @keydown.enter="performSearch"
          />
        </v-col>
        <v-col cols="12" sm="6" md>
          <v-select
            v-model="searchParams.province"
            :items="provinceItems"
            item-title="name"
            item-value="value"
            label="省份/地区"
            variant="solo-filled"
            density="compact"
            flat
            hide-details
            clearable
            bg-color="grey-lighten-4"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>
      <v-row>
        <v-col class="text-right">
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
            <p class="text-body-2 text-grey">请尝试调整筛选条件或重置。</p>
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

                <v-card-text class="flex-grow-1">
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

                <v-divider class="mx-4"></v-divider>

                <v-card-actions class="px-4">
                  <div class="text-caption text-grey">
                    <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                    {{ new Date(item.createdAt).toLocaleDateString() }}
                  </div>
                  <v-spacer></v-spacer>
                  <div v-if="userType === 0 || userType === 2">
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

          <div style="width: 120px" class="ml-4">
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

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #616161;
  padding-right: 12px;
  white-space: nowrap;
}
</style>