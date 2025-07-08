<!-- components/common/CollectBtn.vue -->
<template>
  <v-btn
    :size="size"
    :variant="variant"
    :color="isCollected ? 'orange' : 'blue-grey-darken-4'"
    :icon="isCollected ? 'mdi-bookmark' : 'mdi-bookmark-outline'"
    @click="toggleCollect"
    :loading="loading"
    :disabled="loading"
    class="collect-btn"
  >
    <v-icon :size="iconSize" />
    
    <v-tooltip
      activator="parent"
      :location="tooltipLocation"
      :text="tooltipText"
    />
  </v-btn>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInspirationStore } from '@/stores/inspirationStore'

export interface CollectData {
  type: 'herb' | 'paper' | 'chart' | 'text' | 'video'
  title: string
  subtitle?: string
  content: string
  image?: string
  sourceUrl?: string
  sourceType?: string
  tags?: string[]
  metadata?: Record<string, any>
}

interface Props {
  data: CollectData
  size?: string
  variant?: string
  tooltipLocation?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  variant: 'text',
  tooltipLocation: 'top'
})

const emit = defineEmits<{
  collected: [success: boolean]
  uncollected: [success: boolean]
}>()

const inspirationStore = useInspirationStore()
const loading = ref(false)

// 计算属性
const isCollected = computed(() => {
  return inspirationStore.isCollected(props.data.title, props.data.type)
})

const tooltipText = computed(() => {
  return isCollected.value ? '取消收藏' : '收藏到灵感板'
})

const iconSize = computed(() => {
  const sizeMap: Record<string, string> = {
    'x-small': '12',
    'small': '16',
    'default': '20',
    'large': '24',
    'x-large': '28'
  }
  return sizeMap[props.size] || '20'
})

// 方法
const toggleCollect = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (isCollected.value) {
      // 取消收藏 - 需要找到对应的项目ID
      const item = inspirationStore.items.find(item => 
        item.title === props.data.title && item.type === props.data.type
      )
      
      if (item) {
        inspirationStore.removeItem(item.id)
        emit('uncollected', true)
      }
    } else {
      // 添加收藏
      const success = await inspirationStore.addItem({
        ...props.data,
        sourceUrl: props.data.sourceUrl || window.location.href,
        sourceType: props.data.sourceType || getSourceTypeFromRoute(),
        tags: props.data.tags || generateAutoTags(),
      })
      
      emit('collected', success)
    }
  } catch (error) {
    console.error('收藏操作失败:', error)
        if (isCollected.value) {
    // 如果 isCollected 为 true，说明是 "取消收藏" 操作失败了
    emit('uncollected', false)
    } else {
    // 如果 isCollected 为 false，说明是 "添加收藏" 操作失败了
    emit('collected', false)
}
  } finally {
    // 延迟恢复按钮状态，提供视觉反馈
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

// 工具函数
const getSourceTypeFromRoute = (): string => {
  const path = window.location.pathname
  if (path.includes('/herbs')) return '药材库'
  if (path.includes('/papers')) return '文献库'
  if (path.includes('/courses')) return '课程中心'
  if (path.includes('/graph')) return '知识图谱'
  return '系统'
}

const generateAutoTags = (): string[] => {
  const tags: string[] = []
  
  // 根据数据类型添加标签
  if (props.data.type === 'herb') {
    tags.push('中药材')
    
    // 从 metadata 中提取更多标签
    if (props.data.metadata) {
      if (props.data.metadata.familyName) {
        tags.push(props.data.metadata.familyName)
      }
      if (props.data.metadata.resourceType) {
        tags.push(props.data.metadata.resourceType)
      }
      if (props.data.metadata.lifeForm) {
        const lifeForms = props.data.metadata.lifeForm.split(',')
        tags.push(...lifeForms)
      }
    }
  }
  
  // 根据来源页面添加标签
  const sourceType = getSourceTypeFromRoute()
  if (sourceType !== '系统') {
    tags.push(sourceType)
  }
  
  return tags.filter(Boolean) // 过滤空值
}
</script>

<style scoped lang="scss">
.collect-btn {
  transition: all 0.2s ease-in-out;
  
  &:hover {
    transform: scale(1.1);
  }
  
  // 收藏成功的动画效果
  &.v-btn--loading {
    animation: collectPulse 0.6s ease-in-out;
  }
}

@keyframes collectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

// 不同尺寸的间距调整
.collect-btn.v-btn--size-small {
  min-width: 32px !important;
  width: 32px;
  height: 32px;
}

.collect-btn.v-btn--size-x-small {
  min-width: 28px !important;
  width: 28px;
  height: 28px;
}
</style>