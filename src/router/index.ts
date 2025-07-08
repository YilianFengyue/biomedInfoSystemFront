import { createRouter, createWebHistory } from "vue-router";

import LandingRoutes from "./landing.routes";
import AuthRoutes from "./auth.routes";

export const routes = [
  {
    path: "/",
    redirect: "/dashboard",
    meta: {
      transition: "slide-fade",
        //根路径重定向，通常不直接渲染，可不加动画
    },
  } as any,
  {
    path: "/dashboard",
    component: () => import("@/views/pages/DashBoard.vue"),
    meta: {
      requiresAuth: true,
      layout: "ui",
      transition: "slide-fade", // 主要页面切换
    },
  },
  {
    path: "/dataCenter",
    component: () => import("@/views/pages/biomedicine/DataCenter.vue"),
    meta: {
      layout: "ui",
      title: "数据中心与可视化",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/herb-search",
    name: "herb-search",
    component: () => import("@/views/pages/biomedicine/HerbSearchPage.vue"),
    meta: {
      layout: "ui",
      title: "药材检索",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/Formula",
    name: "Formula",
    component: () => import("@/views/pages/biomedicine/Formula.vue"),
    meta: {
      layout: "ui",
      title: "中医方剂",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/formulaSearch",
    name: "formulaSearch",
    component: () => import("@/views/pages/biomedicine/FormulaSearchPage.vue"),
    meta: {
      layout: "ui",
      title: "配方检索",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/formulaRecommend",
    name: "formulaRecommend",
    component: () => import("@/views/pages/biomedicine/FormulaRecommend.vue"),
    meta: {
      layout: "ui",
      title: "配方检索",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/formulaCompaire",
    name: "formulaCompaire",
    component: () => import("@/views/pages/biomedicine/FormulaComparison.vue"),
    meta: {
      layout: "ui",
      title: "配方比对",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/herbCompaire",
    name: "herbCompaire",
    component: () => import("@/views/pages/biomedicine/HerbCombination.vue"),
    meta: {
      layout: "ui",
      title: "药材配伍",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/data-collection",
    component: () => import("@/views/pages/biomedicine/DataCollection.vue"),
    meta: {
      layout: "ui",
      title: "数据采集",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-up", // 页面感觉像是从下方弹出的一个操作面板
    },
  },
  {
    path: "/education",
    component: () => import("@/views/pages/biomedicine/EduOnline.vue"),
    meta: {
      layout: "ui",
      title: "在线教育",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade", // 用户的指定要求
    },
  },
  {
    path: "/biomedicine/resource-list",
    component: () => import("@/views/pages/biomedicine/ResourceList.vue"),
    meta: {
      layout: "ui",
      title: "资源列表",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/biomedicine/course-list",
    component: () => import("@/views/pages/biomedicine/CoursesPage.vue"),
    meta: {
      layout: "ui",
      title: "系列课程",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/biomedicine/eduupload",
    component: () => import("@/views/pages/biomedicine/EduUpload.vue"),
    meta: {
      layout: "ui",
      title: "上传课程",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-up",
    },
  },
   {
    path: "/courseEdit",
    component: () => import("@/views/pages/biomedicine/CourseEdit.vue"),
    meta: {
      layout: "ui",
      title: "章节课程",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-up",
    },
  },
  {
    path: "/score",
    component: () => import("@/views/pages/biomedicine/Scorejudge.vue"),
    meta: {
      layout: "ui",
      title: "评分判定",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-up",
    },
  },
  {
    path: "/biomedicine/video-List",
    component: () => import("@/views/pages/biomedicine/EduVideolist.vue"),
    meta: {
      layout: "ui",
      title: "视频一览",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/biomedicine/VideoDetail/:id",
    component: () => import("@/views/pages/biomedicine/VideoDetail.vue"),
    meta: {
      layout: "ui",
      title: "视频详情",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-up", // 从列表进入详情，向上滑动
    },
  },
  {
    path: "/biomedicine/resource-detail/:id",
    component: () => import("@/views/pages/biomedicine/ResourceDetail.vue"),
    meta: {
      layout: "ui",
      title: "资源详情",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-up", // 从列表进入详情，向上滑动
    },
  },
  {
    path: "/biomedicine/eduplan",
    component: () => import("@/views/pages/biomedicine/EduPlan.vue"),
    meta: {
      layout: "ui",
      title: "学习计划",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "zoom-fade", // AI生成内容，使用缩放效果
    },
  },
  {
    path: "/biomedicine/performance",
    component: () => import("@/views/pages/biomedicine/Performance.vue"),
    meta: {
      layout: "ui",
      title: "业绩展示",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
  {
    path: "/LiveVideo",
    component: () => import("@/views/pages/biomedicine/LiveKitClassroom.vue"),
    meta: {
      layout: "ui",
      title: "直播课堂",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "zoom-fade", // 进入一个特殊的“房间”
    },
  },
  {
    path: "/herbs/edit/:id",
    component: () => import("@/views/pages/biomedicine/HerbEditPage.vue"),
    meta: {
      layout: "ui",
      title: "药材编辑",
      requiresAuth: false,
      hidePageHeader: true,
      transition: "slide-up",
    },
  },
  {
    path: "/admin",
    component: () => import("@/views/pages/Admin/AdministratorPanel.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      transition: "zoom-fade", // 进入管理后台，使用缩放
    },
  },
  {
    path: "/newsEditor",
    component: () => import("@/views/pages/News/editor/RichTextEditorPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "RichTextEditor",
      transition: "slide-up",
    },
  },
  {
    path: "/newsList",
    component: () => import("@/views/pages/News/editor/NewsListPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "NewsList",
      transition: "slide-fade",
    },
  },
  {
    path: "/newsDetail/:id",
    component: () => import("@/views/pages/News/editor/NewsDetailPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "NewsDetail",
      transition: "slide-up", // 从列表进入详情
    },
  },
  {
    path: "/myHouse",
    component: () => import("@/views/pages/landlord/MyHouse.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      transition: "slide-fade",
    },
  },

  {
    path: "/userManage",
    component: () => import("@/views/pages/Admin/UserManagePage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      transition: "slide-fade",
    },
  },
  {
    path: "/ai/chatbot_v1",
    component: () => import("@/views/chatgpt/ChatBotV1.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      title: "ChatBotV1",
      transition: "zoom-fade",
    },
  },
  {
    path: "/image-bot",
    component: () => import("~/src/views/pages/ImageBot.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      transition: "zoom-fade",
    },
  },
  {
    path: "/plant-recognition",
    name: "plant-recognition",
    component: () => import("@/views/pages/recognition/PlantRecognitionPage.vue"),
    meta: {
      layout: "ui",
      title: "植物识别",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "zoom-fade", // 特殊工具页面
    },
  },
  {
    path: "/knowledge-graph",
    component: () => import("@/views/pages/biomedicine/KnowledgeGraph.vue"),
    meta: {
      layout: "ui",
      title: "中医药知识图谱",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "zoom-fade",
    },
  },
  {
    path: "/formulas",
    component: () => import("@/views/pages/biomedicine/FormulaManagement.vue"),
    meta: {
      layout: "ui",
      title: "方剂管理",
      requiresAuth: true,
      hidePageHeader: true,
      transition: "slide-fade",
    },
  },
    {
    path: "/send-message",
    name: "SendMessage",
    component: () => import("@/views/pages/message/SendMessage.vue"),
    meta: {
      requiresAuth: true,
      layout: "ui", // 或者你希望使用的布局
      title: "发送消息",
      transition: "slide-fade",
    },
  },
  {
    path: "/chat/:contactId", // 使用动态路由参数来表示和谁聊天
    name: "ChatPage",
    component: () => import("@/views/pages/message/ChatPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "ui", // 或者你希望使用的布局
      title: "聊天",
    },
  },
  {
    path: "/profile",
    name: "profile",
    component: () =>
      import(/* webpackChunkName: "profile" */ "@/views/pages/ProfilePage.vue"),
    meta: {
      requiresAuth: true,
      layout: "ui",
      title: "Profile",
      category: "Config",
      transition: "slide-up",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "error",
    component: () =>
      import(/* webpackChunkName: "error" */ "@/views/errors/NotFoundPage.vue"),
    meta: {
      transition: "fade", // 错误页面使用最简单的淡入淡出
    }
  },
  {
    path: "/ui/lottie-animation",
    name: "ui-lottie-animation",
    component: () =>
      import(
        /* webpackChunkName: "ui-lottie-animation" */ "@/views/ui/LottieAnimationPage.vue"
      ),
    meta: {
      requiresAuth: true,
      layout: "ui",
      category: "UI",
      title: "LottieAnimation",
      transition: "zoom-out",
    },
  },
  ...LandingRoutes,
  ...AuthRoutes,
];

export const dynamicRoutes = [];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;