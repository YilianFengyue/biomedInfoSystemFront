<!-- components/herb/HerbCardWrapper.vue -->
<template>
  <div 
    class="herb-card-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 插槽：原有卡片内容完全不变 -->
    <slot />
    
    <!-- 悬停收藏图标 -->
    <HoverCollectIcon 
      :show="showCollectIcon"
      :data="collectData"
      :position="iconPosition"
      @collected="handleCollected"
      @uncollected="handleUncollected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import HoverCollectIcon from './HoverCollectIcon.vue'
import type { CollectData } from './CollectBtn.vue'

// 药材数据类型定义（与现有系统保持一致）
export interface HerbItem {
  id: string | number
  name: string
  scientificName?: string
  description?: string
  imageUrl?: string
  familyName?: string
  lifeForm?: string
  resourceType?: string
  properties?: string
  createdAt?: string
  province?: string
  // 允许其他可能的字段
  [key: string]: any
}

interface Props {
  herb: HerbItem
  iconPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showDelay?: number
  hideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  iconPosition: 'top-right',
  showDelay: 200,
  hideDelay: 100
})

const emit = defineEmits<{
  collected: [herb: HerbItem, success: boolean]
  uncollected: [herb: HerbItem, success: boolean]
}>()

// 状态
const showCollectIcon = ref(false)
let showTimer: NodeJS.Timeout | null = null
let hideTimer: NodeJS.Timeout | null = null

// 计算收藏数据
const collectData = computed((): CollectData => {
  const herb = props.herb
  
  // 生成标签
  const tags: string[] = ['中药材']
  
  if (herb.familyName) {
    tags.push(herb.familyName)
  }
  
  if (herb.resourceType) {
    tags.push(herb.resourceType)
  }
  
  if (herb.lifeForm) {
    // 处理可能的多个生命形式 "草本,多年生"
    const lifeForms = herb.lifeForm.split(',').map(s => s.trim())
    tags.push(...lifeForms)
  }
  
  if (herb.province) {
    tags.push(herb.province)
  }

  // 构建描述内容
  let content = herb.description || ''
  
  // 如果没有描述，从其他字段构建描述
  if (!content) {
    const parts: string[] = []
    
    if (herb.properties) {
      parts.push(`性味：${herb.properties}`)
    }
    
    if (herb.familyName) {
      parts.push(`科属：${herb.familyName}`)
    }
    
    if (herb.lifeForm) {
      parts.push(`生长形式：${herb.lifeForm}`)
    }
    
    if (herb.resourceType) {
      parts.push(`资源类型：${herb.resourceType}`)
    }
    
    content = parts.join('；') || '暂无详细信息'
  }

  return {
    type: 'herb',
    title: herb.name,
    subtitle: herb.scientificName || '',
    content,
    image: herb.imageUrl || '',
    sourceType: '药材库',
    tags,
    metadata: {
      id: herb.id,
      scientificName: herb.scientificName,
      familyName: herb.familyName,
      lifeForm: herb.lifeForm,
      resourceType: herb.resourceType,
      properties: herb.properties,
      province: herb.province,
      createdAt: herb.createdAt,
      // 保存完整的原始数据，便于后续使用
      originalData: herb
    }
  }
})

// 事件处理
const handleMouseEnter = () => {
  // 清除隐藏定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  
  // 设置显示定时器
  if (!showCollectIcon.value) {
    showTimer = setTimeout(() => {
      showCollectIcon.value = true
      showTimer = null
    }, props.showDelay)
  }
}

const handleMouseLeave = () => {
  // 清除显示定时器
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  
  // 设置隐藏定时器
  if (showCollectIcon.value) {
    hideTimer = setTimeout(() => {
      showCollectIcon.value = false
      hideTimer = null
    }, props.hideDelay)
  }
}

const handleCollected = (success: boolean) => {
  emit('collected', props.herb, success)
}

const handleUncollected = (success: boolean) => {
  emit('uncollected', props.herb, success)
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (showTimer) {
    clearTimeout(showTimer)
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>

<style scoped lang="scss">
.herb-card-wrapper {
  position: relative;
  height: 100%;
  
  // 确保卡片在悬停时有合适的层级
  &:hover {
    z-index: 2;
  }
  
  // 平滑的悬停过渡
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  // 可选：为整个卡片添加悬停效果
  &:hover {
    transform: translateY(-1px);
    
    // 传递悬停效果到子卡片
    :deep(.v-card) {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    }
  }
}

// 确保收藏图标在所有内容之上
:deep(.hover-collect-icon) {
  z-index: 10;
}

// 移动端优化
@media screen and (max-width: 768px) {
  .herb-card-wrapper {
    // 移动端可能需要不同的交互方式
    // 可以考虑点击而不是悬停
    &:active {
      transform: scale(0.98);
    }
  }
}

// 触摸设备优化
@media (hover: none) and (pointer: coarse) {
  .herb-card-wrapper {
    // 触摸设备上，可以考虑长按或点击显示收藏按钮
    // 这里先保持简单的实现
  }
}
</style>