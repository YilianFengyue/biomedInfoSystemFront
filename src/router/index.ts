import { createRouter, createWebHistory } from "vue-router";

import LandingRoutes from "./landing.routes";
import AuthRoutes from "./auth.routes";

export const routes = [
  {
    path: "/",
    redirect: "/dashboard",
    meta: {},
  } as any,
  {
    path: "/dashboard",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/pages/DashBoard.vue"),
  },
  {
    path: "/education",
    component: () => import("@/views/pages/biomedicine/EduOnline.vue"),
    meta: {
      layout: "ui",
      title: "在线教育",
      requiresAuth: true, // 需要登录
      hidePageHeader: true, 
    },
  },
  {
    path: "/biomedicine/resource-list",
    component: () => import("@/views/pages/biomedicine/ResourceList.vue"),
    meta: {
      layout: "ui",
      title: "资源列表",
      requiresAuth: false, // 不需要登录
      hidePageHeader: true, 
    },
  },
  {
    path: "/biomedicine/resource-detail/:id",
    component: () => import("@/views/pages/biomedicine/ResourceDetail.vue"),
    meta: {
      layout: "ui",
      title: "资源详情",
      requiresAuth: false, // 不需要登录
      hidePageHeader: true, 
    },
  },
  //管理员
  {
    path: "/admin",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/pages/Admin/AdministratorPanel.vue"),
  },
  //富文本编辑器
  {
    path: "/newsEditor",
    component: () => import("@/views/pages/News/editor/RichTextEditorPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "RichTextEditor",
    },
  },
  //新闻列表
  {
    path: "/newsList",
    component: () => import("@/views/pages/News/editor/NewsListPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "NewsList",
    },
  },
  //新闻详情页
  {
    path: "/newsDetail/:id",
    component: () => import("@/views/pages/News/editor/NewsDetailPage.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      category: "Data",
      title: "NewsDetail",
    },
  },
  {
    path: "/myHouse",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/pages/landlord/MyHouse.vue"),
  },

  {
    path: "/userManage",
    meta: {
      requiresAuth: true,
      layout: "landing",
    },
    component: () => import("@/views/pages/Admin/UserManagePage.vue"),
  },
  {
    path: "/ai/chatbot_v1",
    component: () => import("@/views/chatgpt/ChatBotV1.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      // category: "AI",
      title: "ChatBotV1",
    },
  },
  // image bot
  {
    path: "/image-bot",
    component: () => import("~/src/views/pages/ImageBot.vue"),
    meta: {
      requiresAuth: true,
      layout: "landing",
      // category: "AI",
      // title: "ImageBot",
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
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "error",
    component: () =>
      import(/* webpackChunkName: "error" */ "@/views/errors/NotFoundPage.vue"),
  },
  // lottie Animation
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
    },

  },
  ...LandingRoutes,
  ...AuthRoutes,


];


export const dynamicRoutes = [];

const router = createRouter({
  history: createWebHistory(),
  // hash模式：createWebHashHistory，history模式：createWebHistory
  // process.env.NODE_ENV === "production"

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
