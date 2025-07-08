<!--
* @Component: InspirationBoard
* @Maintainer: J.K. Yang
* @Description: 灵感整理板 - 收藏药材、文献、图表等内容
-->
<script setup lang="ts">
import { useDisplay } from "vuetify";
import { useSnackbarStore } from "@/stores/snackbarStore";
import CopyBtn from "@/components/common/CopyBtn.vue";
import { Icon } from "@iconify/vue";

const snackbarStore = useSnackbarStore();

// 模拟数据 - 后续替换为真实数据
const categories = [
  { label: "全部", value: "all", count: 12 },
  { label: "药材", value: "herb", count: 5 },
  { label: "文献", value: "paper", count: 3 },
  { label: "图表", value: "chart", count: 4 }
];

const currentCategory = ref("all");

// 模拟收藏的内容
const inspirationItems = ref([
  {
    id: "1",
    type: "herb",
    title: "人参",
    subtitle: "Panax ginseng",
    content: "补气固脱，健脾益肺，宁心益智，养血生津",
    image: "https://example.com/ginseng.jpg",
    tags: ["五加科", "多年生草本", "栽培"],
    timestamp: Date.now() - 86400000,
    metadata: {
      family: "五加科",
      properties: "甘、微苦，微温"
    }
  },
  {
    id: "2", 
    type: "paper",
    title: "中医药现代化研究",
    subtitle: "Traditional Chinese Medicine Modernization",
    content: "探讨中医药现代化发展的机遇与挑战，分析传统医学与现代科技的融合路径",
    image: null,
    tags: ["中医药", "现代化", "研究"],
    timestamp: Date.now() - 172800000,
    metadata: {
      authors: "张三, 李四",
      journal: "中医药学报"
    }
  },
  {
    id: "3",
    type: "chart", 
    title: "血府逐瘀汤关系图谱",
    subtitle: "Blood Stasis Formula Network",
    content: "显示血府逐瘀汤中各药材的相互关系和药理作用机制",
    image: "https://example.com/chart.png",
    tags: ["知识图谱", "方剂", "血瘀证"],
    timestamp: Date.now() - 259200000,
    metadata: {
      nodeCount: 13,
      relationCount: 12
    }
  },
  {
    id: "4",
    type: "herb",
    title: "使君子",
    subtitle: "Quisqualis indica L.",
    content: "杀虫消积，健脾",
    image: "https://example.com/shijunzi.jpg", 
    tags: ["使君子科", "多年生藤本植物", "野生"],
    timestamp: Date.now() - 345600000,
    metadata: {
      family: "使君子科",
      properties: "甘，温"
    }
  }
]);

// 过滤后的内容
const filteredItems = computed(() => {
  if (currentCategory.value === "all") {
    return inspirationItems.value;
  }
  return inspirationItems.value.filter(item => item.type === currentCategory.value);
});

// 搜索功能
const searchKeyword = ref("");
const searchedItems = computed(() => {
  if (!searchKeyword.value.trim()) {
    return filteredItems.value;
  }
  return filteredItems.value.filter(item => 
    item.title.includes(searchKeyword.value) ||
    item.content.includes(searchKeyword.value) ||
    item.tags.some(tag => tag.includes(searchKeyword.value))
  );
});

// 获取类型图标
const getTypeIcon = (type: string) => {
  const icons = {
    herb: "mdi-leaf",
    paper: "mdi-file-document",
    chart: "mdi-chart-scatter-plot",
    text: "mdi-text"
  };
  return icons[type] || "mdi-bookmark";
};

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colors = {
    herb: "green",
    paper: "blue", 
    chart: "orange",
    text: "purple"
  };
  return colors[type] || "grey";
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
};

// 删除项目
const deleteItem = (id: string) => {
  const index = inspirationItems.value.findIndex(item => item.id === id);
  if (index > -1) {
    inspirationItems.value.splice(index, 1);
    snackbarStore.showSuccessMessage("已删除");
  }
};

// 清空所有
const clearAll = () => {
  inspirationItems.value = [];
  snackbarStore.showSuccessMessage("已清空所有内容");
};

const dialog = ref(false);
const { xs } = useDisplay();
</script>

<template>
  <v-btn size="50" @click="dialog = !dialog">
    <v-icon size="30">mdi-pin-outline</v-icon>
    <v-tooltip
      activator="parent"
      location="left"
      text="灵感整理板"
    ></v-tooltip>
  </v-btn>

  <teleport to="body">
    <transition name="slide-y">
      <v-card
        v-if="dialog"
        class="dialog-bottom d-flex flex-column"
        :width="xs ? '100%' : '600px'"
        height="500px"
      >
        <!-- 标题栏 -->
        <v-card-title>
          <span class="flex-fill">
            <v-avatar size="40">
              <v-icon size="24" color="primary">mdi-lightbulb</v-icon>
            </v-avatar>
            灵感整理板
          </span>
          <v-spacer></v-spacer>
          <v-btn icon @click.stop="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider />
        
        <!-- 操作栏 -->
        <v-card-actions class="px-5 py-3">
          <!-- 分类筛选 -->
          <v-btn-toggle
            v-model="currentCategory"
            variant="outlined"
            density="compact"
            color="primary"
            mandatory
            class="mr-2"
          >
            <v-btn
              v-for="cat in categories"
              :key="cat.value"
              :value="cat.value"
              size="small"
            >
              {{ cat.label }}
              <v-chip size="x-small" class="ml-1" v-if="cat.count">
                {{ cat.count }}
              </v-chip>
            </v-btn>
          </v-btn-toggle>

          <v-spacer></v-spacer>

          <!-- 清空按钮 -->
          <v-btn
            size="small"
            variant="text"
            color="error"
            @click="clearAll"
            :disabled="inspirationItems.length === 0"
          >
            <v-icon size="16" class="mr-1">mdi-delete-sweep</v-icon>
            清空
          </v-btn>
        </v-card-actions>

        <v-divider />

        <!-- 搜索栏 -->
        <div class="pa-3">
          <v-text-field
            v-model="searchKeyword"
            placeholder="搜索收藏内容..."
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </div>

        <!-- 内容区域 -->
        <v-card-text class="flex-grow-1 pa-0">
          <perfect-scrollbar class="inspiration-container">
            <!-- 空状态 -->
            <div v-if="searchedItems.length === 0" class="empty-state">
              <v-icon size="64" color="grey-lighten-2">mdi-bookmark-outline</v-icon>
              <p class="text-grey-lighten-1 mt-4">
                {{ searchKeyword ? '未找到匹配内容' : '还没有收藏任何内容' }}
              </p>
              <p class="text-caption text-grey-lighten-2">
                {{ searchKeyword ? '尝试其他关键词' : '在页面中选择内容并点击收藏按钮' }}
              </p>
            </div>

            <!-- 内容卡片列表 -->
            <div v-else class="pa-3">
              <v-card
                v-for="item in searchedItems"
                :key="item.id"
                class="inspiration-card mb-3"
                variant="outlined"
                hover
              >
                <!-- 卡片头部 -->
                <div class="d-flex align-center pa-3 pb-2">
                  <v-icon 
                    :icon="getTypeIcon(item.type)" 
                    :color="getTypeColor(item.type)"
                    size="20"
                    class="mr-2"
                  />
                  <div class="flex-grow-1">
                    <h6 class="text-subtitle-2 font-weight-bold mb-0">
                      {{ item.title }}
                    </h6>
                    <p class="text-caption text-grey-darken-1 mb-0" v-if="item.subtitle">
                      {{ item.subtitle }}
                    </p>
                  </div>
                  <v-btn 
                    icon 
                    size="small" 
                    variant="text"
                    @click="deleteItem(item.id)"
                  >
                    <v-icon size="16">mdi-close</v-icon>
                  </v-btn>
                </div>

                <!-- 图片预览 -->
                <div v-if="item.image" class="px-3">
                  <v-img
                    :src="item.image"
                    height="120"
                    cover
                    class="rounded"
                  >
                    <template #error>
                      <div class="d-flex align-center justify-center h-100 bg-grey-lighten-4">
                        <v-icon color="grey">mdi-image-broken</v-icon>
                      </div>
                    </template>
                  </v-img>
                </div>

                <!-- 内容 -->
                <v-card-text class="pt-2">
                  <p class="text-body-2 mb-2 text-clamp-2">
                    {{ item.content }}
                  </p>
                  
                  <!-- 标签 -->
                  <div class="mb-2">
                    <v-chip
                      v-for="tag in item.tags"
                      :key="tag"
                      size="x-small"
                      variant="outlined"
                      class="mr-1 mb-1"
                    >
                      {{ tag }}
                    </v-chip>
                  </div>
                </v-card-text>

                <!-- 操作栏 -->
                <v-card-actions class="pt-0">
                  <span class="text-caption text-grey">
                    {{ formatTime(item.timestamp) }}
                  </span>
                  <v-spacer />
                  
                  <!-- 查看详情 -->
                  <v-btn size="small" variant="text" icon>
                    <v-icon size="16">mdi-eye</v-icon>
                    <v-tooltip activator="parent" location="top">
                      查看详情
                    </v-tooltip>
                  </v-btn>
                  
                  <!-- 复制内容 -->
                  <CopyBtn :text="item.content" size="small" />
                  
                  <!-- 分享 -->
                  <v-btn size="small" variant="text" icon>
                    <v-icon size="16">mdi-share</v-icon>
                    <v-tooltip activator="parent" location="top">
                      分享
                    </v-tooltip>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
          </perfect-scrollbar>
        </v-card-text>
      </v-card>
    </transition>
  </teleport>
</template>

<style scoped lang="scss">
.dialog-bottom {
  z-index: 999;
  position: fixed;
  bottom: 10px;
  right: 0px;
}

.inspiration-container {
  height: 100%;
  max-height: 320px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  text-align: center;
}

.inspiration-card {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
}

.text-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 响应式调整
@media screen and (max-width: 768px) {
  .inspiration-card {
    .v-card-actions {
      padding: 8px 16px;
    }
  }
}
</style>