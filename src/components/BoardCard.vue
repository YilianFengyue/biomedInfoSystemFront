<template>
  <v-card class="pa-5 mt-4 card-shadow">
    <div class="d-flex align-start font-weight-bold text-title">
      <!-- 拖拽手柄 -->
      <v-icon
        class="drag-handle mr-2"
        icon="mdi-drag-horizontal-variant"
        style="cursor: move; color: #757575"
      ></v-icon>

      <span class="flex-fill">{{ card.title }}</span>
      
      <v-menu location="bottom end" transition="slide-x-transition">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            size="small"
            variant="text"
            icon="mdi-dots-vertical"
            rounded
            color="primary"
            class="my-n2"
            @click.stop
          ></v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="$emit('edit')">
            <v-list-item-title class="d-inline-flex align-center">
              <v-icon icon="mdi-pencil" size="16" class="mr-1"></v-icon>
              Edit
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="$emit('delete')">
            <v-list-item-title class="d-inline-flex align-center">
              <v-icon icon="mdi-delete" size="16" class="mr-1"></v-icon>
              Delete
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- 图片显示 -->
    <div v-if="card.imageUrl" class="mt-3">
      <v-img
        :src="card.imageUrl"
        :aspect-ratio="16/9"
        cover
        class="rounded"
        style="max-height: 200px;"
        @click.stop="showImagePreview"
      >
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
        </template>
      </v-img>
    </div>

    <!-- PDF信息卡片 -->
    <div v-if="card.pdfInfo" class="mt-3">
      <v-card variant="outlined" @click.stop="$emit('showPdf', card.pdfInfo)">
        <v-card-text class="pa-3 d-flex align-center">
          <v-icon icon="mdi-file-pdf-box" color="red" size="24" class="mr-3"></v-icon>
          <div class="flex-fill">
            <div class="font-weight-medium">{{ card.pdfInfo.name }}</div>
            <div class="text-caption text-grey">点击预览 PDF</div>
          </div>
          <v-icon icon="mdi-eye" color="primary"></v-icon>
        </v-card-text>
      </v-card>
    </div>

    <div class="text-content mt-2">{{ card.description }}</div>
  </v-card>

  <!-- 图片预览对话框 -->
  <v-dialog v-model="imageDialog" max-width="600">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="flex-fill">图片预览</span>
        <v-btn icon="mdi-close" variant="text" @click="imageDialog = false"></v-btn>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-img :src="card.imageUrl" contain></v-img>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['edit', 'delete', 'showPdf'])

const imageDialog = ref(false)

const showImagePreview = () => {
  imageDialog.value = true
}
</script>

<style lang="scss" scoped>
.card-shadow {
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px !important;
}

.drag-handle {
  cursor: move;
}
</style>