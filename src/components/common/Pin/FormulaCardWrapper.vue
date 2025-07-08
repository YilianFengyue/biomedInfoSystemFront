<!-- components/common/Pin/FormulaCardWrapper.vue -->
<template>
  <div 
    class="formula-card-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 插槽：原有卡片内容完全不变 -->
    <slot />
    
    <!-- 悬停收藏图标 -->
    <HoverCollectIcon 
      :show="showCollectIcon"
      :data="collectData"
      position="top-right"
      @collected="handleCollected"
      @uncollected="handleUncollected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import HoverCollectIcon from './HoverCollectIcon.vue'
import type { CollectData } from './CollectBtn.vue'

// 经方数据类型（与你的接口保持一致）
interface FormulaItem {
  id: number
  name: string
  alias: string | null
  source: string
  dynasty: string
  author: string
  composition: string
  preparation: string
  usage: string
  dosageForm: string
  functionEffect: string
  mainTreatment: string
}

interface Props {
  formula: FormulaItem
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
  collected: [formula: FormulaItem, success: boolean]
  uncollected: [formula: FormulaItem, success: boolean]
}>()

// 状态管理（完全复用药材的逻辑）
const showCollectIcon = ref(false)
let showTimer: NodeJS.Timeout | null = null
let hideTimer: NodeJS.Timeout | null = null

// 计算收藏数据（关键：把经方数据转为统一格式）
const collectData = computed((): CollectData => {
  const formula = props.formula
  
  // 生成标签
  const tags: string[] = ['经方', '中医方剂']
  
  if (formula.dynasty) {
    tags.push(formula.dynasty)
  }
  
  if (formula.source) {
    tags.push(formula.source)
  }
  
  if (formula.author) {
    tags.push(formula.author)
  }

  // 构建描述内容
  const contentParts: string[] = []
  
  if (formula.functionEffect) {
    contentParts.push(`功效：${formula.functionEffect}`)
  }
  
  if (formula.mainTreatment) {
    contentParts.push(`主治：${formula.mainTreatment}`)
  }
  
  if (formula.composition) {
    contentParts.push(`组成：${formula.composition}`)
  }
  
  const content = contentParts.join('\n') || '暂无详细信息'

  return {
    type: 'paper', // 经方归类为文献类型
    title: formula.name,
    subtitle: formula.alias ? `${formula.alias} - ${formula.source}` : formula.source,
    content,
    image: '', // 经方一般没有图片
    sourceType: '经方数据库',
    tags,
    metadata: {
      id: formula.id,
      dynasty: formula.dynasty,
      author: formula.author,
      source: formula.source,
      composition: formula.composition,
      preparation: formula.preparation,
      usage: formula.usage,
      dosageForm: formula.dosageForm,
      // 保存完整的原始数据
      originalData: formula
    }
  }
})

// 事件处理（完全复用药材的逻辑）
const handleMouseEnter = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  
  if (!showCollectIcon.value) {
    showTimer = setTimeout(() => {
      showCollectIcon.value = true
      showTimer = null
    }, props.showDelay)
  }
}

const handleMouseLeave = () => {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  
  if (showCollectIcon.value) {
    hideTimer = setTimeout(() => {
      showCollectIcon.value = false
      hideTimer = null
    }, props.hideDelay)
  }
}

const handleCollected = (success: boolean) => {
  emit('collected', props.formula, success)
}

const handleUncollected = (success: boolean) => {
  emit('uncollected', props.formula, success)
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
.formula-card-wrapper {
  position: relative;
  height: 100%;
  
  &:hover {
    z-index: 2;
  }
  
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    
    :deep(.v-card) {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
    }
  }
}

:deep(.hover-collect-icon) {
  z-index: 10;
}

@media screen and (max-width: 768px) {
  .formula-card-wrapper {
    &:active {
      transform: scale(0.98);
    }
  }
}
</style>