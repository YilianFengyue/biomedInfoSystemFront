<script setup lang="ts">
import CreateProjectDialog from "./CreateProjectDialog.vue"; // 建议将 CreateProject.vue 重命名为 CreateProjectDialog.vue
import { useProfileStore } from "@/stores/profileStore";
import { useResearchStore } from "../researchStore";

const researchStore = useResearchStore();
const profile = useProfileStore();

// 从 profileStore 获取用户角色，功能保持不变
const userRole = computed<'admin' | 'student' | 'teacher'>(() => {
  const roleVal = profile.user?.role;
  switch (roleVal) {
    case 0:
      return "admin";
    case 2:
      return "teacher";
    default:
      return "student";
  }
});
//  教师专用菜单
const teacherMenus = [
  {
    icon: "mdi-folder-plus",
    title: "我的课题", 
    subtitle: "创建和管理课题",
    path: "/research/projects",
   badge: { color: "primary", content: researchStore.totalProjectsCount.toString() }
  },
  {
    icon: "mdi-clipboard-plus",
    title: "任务发布",
    subtitle: "分配研究任务", 
    path: "/research/tasks",
     badge: { color: "warning", content: researchStore.totalTasksCount.toString() }
  },
  {
    icon: "mdi-file-check",
    title: "论文评审",
    subtitle: "评审学生论文",
    path: "/research/papers", 
    badge: { color: "success", content: researchStore.pendingSubmissionsCount.toString() }
  },
  {
    icon: "mdi-account-check",
    title: "申请审核",
    subtitle: "审核学生申请",
    path: "/research/applications",
    badge: { color: "error", content: researchStore.pendingApplicationsCount.toString() }
  },
  {
    icon: "mdi-chart-line",
    title: "项目统计",
    subtitle: "查看项目数据",
    path: "/research/statistics"
  }
];

// 🔥 学生专用菜单  
const studentMenus = [
  {
    icon: "mdi-folder-search",
    title: "浏览课题",
    subtitle: "查找感兴趣的课题",
    path: "/research/projects",
    badge: { color: "info", content: researchStore.availableProjectsCount.toString() }
  },
  {
    icon: "mdi-clipboard-text",
    title: "我的任务", 
    subtitle: "查看分配的任务",
    path: "/research/tasks",
     badge: { color: "warning", content: researchStore.myTasksCount.toString() }
  },
  {
    icon: "mdi-file-upload",
    title: "论文提交",
    subtitle: "提交研究成果",
    path: "/research/papers",
    badge: { color: "primary", content: researchStore.mySubmissionsCount.toString() }
  },
  {
    icon: "mdi-account-clock",
    title: "申请记录", 
    subtitle: "查看申请状态",
    path: "/research/applications"
  },
  {
    icon: "mdi-chart-donut",
    title: "学习进度",
    subtitle: "查看个人统计", 
    path: "/research/statistics"
  }
];

const currentMenus = computed(() => {
  return userRole.value === 'teacher' ? teacherMenus : studentMenus;
});
onMounted(async () => {
  if (userRole.value === 'teacher') {
    researchStore.setUserRole('teacher');
    await Promise.all([
      researchStore.fetchProjects({ page: 1, size: 100 }),
      researchStore.fetchPendingApplications({ page: 1, size: 100 }),
      researchStore.fetchPendingSubmissions({ page: 1, size: 100 }),
      researchStore.fetchTasks({ page: 1, size: 100 })
    ]);
  } else {
    // 学生端数据加载
    researchStore.setUserRole('student');
    await Promise.all([
      researchStore.fetchProjects({ page: 1, size: 100 }),
      researchStore.fetchTasks({ page: 1, size: 100 }),
      researchStore.fetchMyApplications()
    ]);
    // 加载学生的论文提交记录
    try {
      const { data } = await researchStore.studentApi.submissions.list();
      if (data.code === 20000) {
        researchStore.submissions = data.data;
      }
    } catch (error) {
      console.error('Failed to load student submissions:', error);
    }
  }
});
</script>

<template>
  <v-card height="100%" class="pa-3">
    
    <!-- 🔥 角色标识 -->
    <v-chip 
      :color="userRole === 'teacher' ? 'primary' : 'success'" 
      variant="tonal" 
      class="mb-3"
      block
    >
      <v-icon start>{{ userRole === 'teacher' ? 'mdi-account-tie' : 'mdi-school' }}</v-icon>
      {{ userRole === 'teacher' ? '教师端' : '学生端' }}
    </v-chip>

    <!-- 🔥 只有教师显示创建按钮 -->
    <CreateProjectDialog v-if="userRole === 'teacher'" />
    
    <!-- 🔥 学生显示申请提示 -->
    <v-alert 
      v-else
      type="info" 
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      浏览课题并申请加入项目
    </v-alert>

    <!-- 🔥 根据角色显示不同菜单 -->
    <v-list nav class="mt-2 pa-0">
      <v-list-item
        v-for="menu in currentMenus"
        :key="menu.path"
        :prepend-icon="menu.icon"
        :to="menu.path"
        active-class="text-primary bg-primary-lighten-5"
        link
        class="mb-1 rounded-lg"
      >
        <v-list-item-title>{{ menu.title }}</v-list-item-title>
        <v-list-item-subtitle class="text-caption">{{ menu.subtitle }}</v-list-item-subtitle>
        
        <template v-slot:append v-if="menu.badge">
          <v-badge 
            :color="menu.badge.color" 
            :content="menu.badge.content" 
            inline
          ></v-badge>
        </template>
      </v-list-item>
    </v-list>

    <div class="pa-1 mt-2 text-overline text-grey">研究领域</div>
    <v-list nav class="mt-2 pa-0">
      <v-list-item to="/research/field/pharmacology" link title="中医药网络药理学">
        <template v-slot:prepend>
          <v-icon color="teal">mdi-flask</v-icon>
        </template>
      </v-list-item>
      <v-list-item to="/research/field/herbs" link title="中药资源学">
        <template v-slot:prepend>
          <v-icon color="green">mdi-leaf</v-icon>
        </template>
      </v-list-item>
      <v-list-item to="/research/field/ai-tcm" link title="中医信息学">
        <template v-slot:prepend>
          <v-icon color="deep-purple">mdi-brain</v-icon>
        </template>
      </v-list-item>
      <v-list-item to="/research/field/clinical" link title="中医临床研究">
        <template v-slot:prepend>
          <v-icon color="red">mdi-medical-bag</v-icon>
        </template>
      </v-list-item>
    </v-list>

    <div class="pa-1 mt-2 text-overline text-grey">快捷操作</div>
    <v-list nav class="mt-2 pa-0">
      <v-list-item prepend-icon="mdi-cloud-upload" to="/research/upload" link title="文件上传">
      </v-list-item>
      <v-list-item prepend-icon="mdi-cog" to="/research/settings" link title="系统设置">
      </v-list-item>
    </v-list>
  </v-card>
</template>