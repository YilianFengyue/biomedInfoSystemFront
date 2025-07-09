// src/router/research.routes.ts

import type { RouteRecordRaw } from 'vue-router';

const researchRoutes: RouteRecordRaw[] = [
  {
    // 访问 /research 时，自动跳到 /research/projects
    path: '',
    redirect: '/research/projects'
  },
  {
    path: 'projects',
    name: 'ResearchProjects',
    // 加载我们在第1步创建的那个页面
    component: () => import('@/views/ResearchHub/pages/ProjectManagement.vue'),
  },
   {
    path: 'projects/:id', // 使用 :id 作为动态参数
    name: 'ProjectDetail',
    component: () => import('@/views/ResearchHub/pages/ProjectDetail.vue'),
    meta: {
      title: '课题详情',
    }
  },
  {
      path: 'tasks',
      name: 'TaskList',
      component: () => import('@/views/ResearchHub/pages/TaskManagement.vue'),
      meta: {
        title: '任务管理'
      }
    },
    {
        path: 'papers',
        name: 'ResearchPapers',
        component: () => import('@/views/ResearchHub/pages/PaperManagement.vue'),
        meta: {
          title: '论文管理',
          transition: 'fade'
        }
      },
      {
        path: 'applications',
        name: 'ResearchApplications',
        component: () => import('@/views/ResearchHub/pages/ApplicationManagement.vue'),
        meta: {
          title: '申请管理',
          requiresRole: 'teacher',
          transition: 'fade'
        }
      },
      {
        path: 'statistics',
        name: 'ResearchStatistics',
        component: () => import('@/views/ResearchHub/pages/Statistics.vue'),
        meta: {
          title: '数据统计',
          transition: 'fade'
        }
      },
      {
        path: 'field/:field',
        name: 'ResearchField',
        component: () => import('@/views/ResearchHub/pages/ResearchField.vue'),
        meta: { title: '研究领域' }
      },
      {
        path: 'upload',
        name: 'ResearchUpload',
        component: () => import('@/views/ResearchHub/pages/FileUpload.vue'),
        meta: { title: '文件上传' }
      },
      {
        path: 'settings',
        name: 'ResearchSettings', 
        component: () => import('@/views/ResearchHub/pages/Settings.vue'),
        meta: { title: '系统设置' }
      }
];

export default researchRoutes;