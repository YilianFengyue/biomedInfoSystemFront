<template>
  <!-- 移除根元素的click事件，避免与拖拽冲突 -->
  <v-card class="pa-5 mt-4 card-shadow">
    <div class="d-flex align-start font-weight-bold text-title">
      <span class="flex-fill">{{ card.title }}</span>
      <!-- 更多菜单 -->
      <v-menu 
        location="bottom end" 
        transition="slide-x-transition"
        @click.stop
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            size="small"
            icon="mdi-dots-vertical"
            variant="text"
            rounded
            color="primary"
            class="my-n2"
          />
        </template>
        <v-list density="compact">
          <v-list-item @click.stop="$emit('edit')">
            <v-list-item-title>
              <v-icon icon="mdi-pencil" size="16" class="mr-1" />
              Edit
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click.stop="$emit('delete')">
            <v-list-item-title>
              <v-icon icon="mdi-delete" size="16" class="mr-1" />
              Delete
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- 图片 -->
    <div v-if="card.imageUrl" class="mt-3">
      <v-img
        :src="card.imageUrl"
        @click.stop="showImagePreview"
        :aspect-ratio="16/9"
        cover
        class="rounded cursor-pointer"
        style="max-height:200px"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </template>
      </v-img>
    </div>

    <!-- PDF -->
    <div v-if="card.pdfInfo" class="mt-3">
      <v-card
        variant="outlined"
        @click.stop="$emit('showPdf', card.pdfInfo)"
        class="d-flex align-center pa-3 cursor-pointer"
      >
        <v-icon icon="mdi-file-pdf-box" color="red" size="24" class="mr-3" />
        <div class="flex-fill">
          <div class="font-weight-medium">{{ card.pdfInfo.name }}</div>
          <div class="text-caption text-grey">点击预览 PDF</div>
        </div>
        <v-icon icon="mdi-eye" color="primary" />
      </v-card>
    </div>

    <div class="text-content mt-2">{{ card.description }}</div>

    <!-- 图片预览对话框 -->
    <v-dialog v-model="imageDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span class="flex-fill">图片预览</span>
          <v-btn icon="mdi-close" variant="text" @click="imageDialog = false" />
        </v-card-title>
        <v-card-text class="pa-0">
          <v-img :src="card.imageUrl" contain />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ 
  card: any 
}>()

defineEmits(['edit', 'delete', 'showPdf'])

const imageDialog = ref(false)

const showImagePreview = () => {
  imageDialog.value = true
}
</script>

<style scoped>
.card-shadow {
  box-shadow: 0 2px 8px rgba(99, 99, 99, .2) !important;
  user-select: none;
  cursor: move; /* 添加拖拽手势 */
}

/* 悬浮时显示可拖拽 */
.card-shadow:hover {
  box-shadow: 0 4px 12px rgba(99, 99, 99, .3) !important;
}

/* 正在拖拽时的样式 */
.sortable-drag .card-shadow {
  cursor: grabbing !important;
}

.cursor-pointer {
  cursor: pointer;
}

/* 防止内部元素干扰拖拽 */
.v-card__text,
.text-content {
  pointer-events: none;
}

/* 允许特定元素交互 */
.v-btn,
.v-img,
.v-card[variant="outlined"] {
  pointer-events: auto;
}
</style>