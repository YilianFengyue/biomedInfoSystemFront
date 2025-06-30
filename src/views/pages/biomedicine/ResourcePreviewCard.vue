<template>
  <v-card rounded="lg" elevation="6">
    <v-img
      :src="resource.coverImageUrl || defaultCover"
      height="350"
      cover
      gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      class="align-end text-white"
    >
      <template v-slot:placeholder>
        <div class="d-flex align-center justify-center fill-height">
          <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
        </div>
      </template>
      <v-card-title class="text-h4 font-weight-bold mb-2" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">
        {{ resource.title }}
      </v-card-title>
    </v-img>

    <v-card-subtitle class="d-flex align-center pa-4">
      <v-avatar :color="getAvatarColor(resource.authorName)" size="32" class="mr-3">
        <span>{{ resource.authorName?.charAt(0).toUpperCase() || 'N/A' }}</span>
      </v-avatar>
      <span class="font-weight-medium">{{ resource.authorName || '未知作者' }}</span>
      <v-divider vertical class="mx-3"></v-divider>
      <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
      <span class="text-caption">发布于 {{ formatPublishDate(resource.createdAt) }}</span>
    </v-card-subtitle>

    <v-divider></v-divider>

    <v-card-text class="pa-5 text-body-1 article-content">
      <div v-html="resource.content"></div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import defaultCover from '@/assets/edu/new.jpg';

// 数据接口定义
interface ResourceDetailData {
  id: number;
  title: string;
  authorName: string;
  content: string;
  coverImageUrl: string | null;
  createdAt: string;
}

const props = defineProps<{
  resource: ResourceDetailData;
}>();

// --- 辅助函数 ---
const getAvatarColor = (author: string) => {
  if (!author) return 'grey';
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
  return colors[author.charCodeAt(0) % colors.length];
};

const formatPublishDate = (dateString: string) => {
  if (!dateString) return '未知日期';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: bold;
}

.article-content :deep(p) {
  line-height: 1.8;
  margin-bottom: 1rem;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1rem 0;
}
</style>