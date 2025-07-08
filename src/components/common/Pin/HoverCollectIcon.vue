<!-- components/common/HoverCollectIcon.vue -->
<template>
  <transition name="collect-fade" appear>
    <div v-if="show" class="hover-collect-icon" :class="positionClass">
      <CollectBtn 
        :data="data"
        :size="size"
        :variant="variant"
        :tooltip-location="tooltipLocation"
        @collected="$emit('collected', $event)"
        @uncollected="$emit('uncollected', $event)"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import CollectBtn, { type CollectData } from './CollectBtn.vue'

interface Props {
  show: boolean
  data: CollectData
  size?: string
  variant?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  tooltipLocation?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  variant: 'elevated',
  position: 'top-right',
  tooltipLocation: 'left'
})

const emit = defineEmits<{
  collected: [success: boolean]
  uncollected: [success: boolean]
}>()

// 计算位置样式类
const positionClass = computed(() => {
  return `position-${props.position}`
})
</script>

<style scoped lang="scss">
:deep(.v-btn) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  background-color: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(158, 158, 158, 0.4) !important;
  
  /* 未收藏时的图标样式 */
  .v-icon {
    color: rgba(97, 97, 97, 0.8) !important;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 1) !important;
    /* 直接用纯色，也可改成 #BCA88199 透明版 */
    border-color: #BCA881 !important;
    
    .v-icon {
      color: #BCA881 !important;
    }
  }
}
.hover-collect-icon {
  position: absolute;
  z-index: 10;
  
  // 不同位置的定位
  &.position-top-right {
    top: 8px;
    right: 8px;
  }
  
  &.position-top-left {
    top: 8px;
    left: 8px;
  }
  
  &.position-bottom-right {
    bottom: 8px;
    right: 8px;
  }
  
  &.position-bottom-left {
    bottom: 8px;
    left: 8px;
  }
  
  // 阴影效果让按钮更突出
  :deep(.v-btn) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(4px);
    background-color: rgba(255, 255, 255, 0.95) !important;
    
    // 悬停效果
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      transform: scale(1.05);
    }
  }
}

// 淡入淡出动画
.collect-fade-enter-active,
.collect-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.collect-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-5px);
}

.collect-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-5px);
}

.collect-fade-enter-to,
.collect-fade-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

// 响应式调整
@media screen and (max-width: 768px) {
  .hover-collect-icon {
    &.position-top-right,
    &.position-bottom-right {
      right: 4px;
    }
    
    &.position-top-left,
    &.position-bottom-left {
      left: 4px;
    }
    
    &.position-top-right,
    &.position-top-left {
      top: 4px;
    }
    
    &.position-bottom-right,
    &.position-bottom-left {
      bottom: 4px;
    }
  }
}
</style>