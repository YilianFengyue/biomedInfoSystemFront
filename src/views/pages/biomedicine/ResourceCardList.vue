<template>
  <v-container>
    <v-row align="stretch">
      <v-col
        v-for="resource in resources"
        :key="resource.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="text-blue-grey-darken-3 h-100 d-flex flex-column resource-card"
          hover
          elevation="4"
          v-ripple
          @click="navigateToDetail(resource)"
        >
          <v-img
            :src="resource.coverImageUrl || defaultCover"
            height="200"
            cover
            class="mx-4 mt-4"
            @error="handleImageError"
          >
          <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
              </div>
            </template>
          </v-img>

          <v-card-item class="flex-grow-1">
            <template v-slot:prepend>
              <v-avatar :color="getAvatarColor(resource.authorName)" size="40">
                <span class="text-h6">{{ resource.authorName?.charAt(0).toUpperCase() || 'N/A' }}</span>
              </v-avatar>
            </template>

            <v-card-title class="text-h6 font-weight-bold">
              {{ resource.title }}
            </v-card-title>

            <v-card-subtitle class="d-flex align-center mt-1">
              <v-icon size="small" class="mr-1">mdi-account</v-icon>
              {{ resource.authorName || '未知作者' }}
              <v-spacer></v-spacer>
              <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
              {{ formatPublishTime(resource.createdAt) }}
            </v-card-subtitle>
          </v-card-item>

          <v-card-text>
            <p class="text-body-1 text-truncate-multiline">
              {{ getPlainText(resource.content) }}
            </p>
          </v-card-text>

          <v-card-actions>
            <v-btn variant="text" color="primary" @click.stop="navigateToDetail(resource)">
              查看详情
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click.stop="shareResource(resource)">
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="!resources || resources.length === 0" justify="center">
      <v-col cols="12" class="text-center py-10">
        <v-icon size="64" color="grey">mdi-book-open-page-variant-outline</v-icon>
        <p class="text-h6 text-grey mt-4">
          暂无精选资源
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import defaultCover from '@/assets/edu/new.jpg';

// ... interface 定义和 props 定义保持不变 ...
interface EduResource {
  id: number;
  title: string;
  coverImageUrl: string;
  content: string;
  authorId: number;
  authorName: string;
  status: string;
  createdAt: string; // 假设后端返回的是 ISO 格式的日期字符串
}

const props = defineProps<{
  resources: EduResource[];
}>();

const router = useRouter();

//  ↓↓↓ 新增图片加载错误处理函数 ↓↓↓
/**
 * 处理图片加载失败事件
 * @param event - DOM事件对象
 */
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.src = defaultCover;
  }
};
//  ↑↑↑ 新增图片加载错误处理函数 ↑↑↑


// --- 复用自NewsList的辅助函数 (保持不变) ---

const getPlainText = (html: string | null | undefined): string => {
  if (!html) return '暂无内容简介';
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>?/gm, '');
};

const formatPublishTime = (dateString: string) => {
  if (!dateString) return '未知时间';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return '今天';
  if (diffDays <= 2) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getAvatarColor = (author: string) => {
  if (!author) return 'grey';
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
  const index = author.charCodeAt(0) % colors.length;
  return colors[index];
};

// --- 卡片交互事件 (保持不变) ---

const navigateToDetail = (resource: EduResource) => {
  console.log(`跳转到资源: ${resource.title}`);
  router.push(`/biomedicine/resource-detail/${resource.id}`);
};

const shareResource = async (resource: EduResource) => {
  const shareData = {
    title: resource.title,
    text: `来看看这篇来自 ${resource.authorName} 的教学资源`,
    url: window.location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log('分享被取消', err);
    }
  } else {
    alert('您的浏览器不支持分享功能，请手动复制链接。');
  }
};
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.text-truncate-multiline {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  min-height: 4.5em; 
  max-height: 4.5em;
}

.resource-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.resource-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
</style>