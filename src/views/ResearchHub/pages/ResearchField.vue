<!--
* @Component: 研究领域页面
* @Description: 按研究领域分类浏览项目
-->
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useResearchStore } from "../researchStore";

import { useProfileStore } from "@/stores/profileStore";   // ← 路径按你项目实际调整
import ProjectList from "@/views/ResearchHub/components/ProjectList.vue";

const profile = useProfileStore();
const route = useRoute();
const researchStore = useResearchStore();

const userRole = computed<'teacher' | 'student'>(() => {
  const val = profile.user?.role;
  return val === 2 || val === 0 ? 'teacher' : 'student';
});
const fieldMap: Record<string, string> = {
  'pharmacology': '中医药网络药理学',
  'herbs': '中药资源学',
  'ai-tcm': '中医信息学',
  'clinical': '中医临床研究'
};

const fieldInfo: Record<string, { icon: string; color: string; description: string }> = {
  '中医药网络药理学': {
    icon: 'mdi-flask',
    color: 'teal',
    description: '运用网络药理学方法研究中药复方的作用机制、药效物质基础和配伍规律'
  },
  '中药资源学': {
    icon: 'mdi-leaf',
    color: 'green',
    description: '研究中药资源的分布、保护、可持续利用和质量控制'
  },
  '中医信息学': {
    icon: 'mdi-brain',
    color: 'deep-purple',
    description: '将人工智能、大数据等信息技术应用于中医诊疗和研究'
  },
  '中医临床研究': {
    icon: 'mdi-medical-bag',
    color: 'red',
    description: '开展中医药临床试验，评价中医药的有效性和安全性'
  }
};

const currentField = computed(() => {
  const fieldKey = route.params.field as string;
  return fieldMap[fieldKey] || '';
});

const currentFieldInfo = computed(() => {
  return fieldInfo[currentField.value] || { icon: 'mdi-folder', color: 'grey', description: '' };
});

// 设置用户角色并加载该领域的项目
onMounted(() => {
  researchStore.setUserRole(userRole.value); // 现在类型完全匹配
});
</script>

<template>
  <div>
    <!-- 领域介绍卡片 -->
    <v-card elevation="2" class="mb-6 field-header-card">
      <v-card-text class="d-flex align-center pa-6">
        <v-icon 
          :color="currentFieldInfo.color" 
          size="64" 
          class="mr-4"
        >
          {{ currentFieldInfo.icon }}
        </v-icon>
        <div>
          <h2 class="text-h4 font-weight-bold mb-2">{{ currentField }}</h2>
          <p class="text-body-1 text-grey-darken-1">{{ currentFieldInfo.description }}</p>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- 项目列表 -->
    <ProjectList :research-field-filter="currentField" />
  </div>
</template>

<style scoped lang="scss">
.field-header-card {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border-radius: 16px !important;
}
</style>