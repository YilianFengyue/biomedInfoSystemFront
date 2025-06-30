import { createRouter, createWebHistory } from "vue-router";
import { useTokenStore } from "@/stores/tokenStore";
import UILayout from "@/layouts/UILayout.vue";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    component: () => import("@/views/pages/biomedicine/DataCenter.vue"),
    meta: {
      layout: "ui",
      title: "数据中心与可视化",
      requiresAuth: true, // 需要登录
    },
  },
  // 新增的路由配置
  {
    path: "/herb-search",
    name: "herb-search",
    component: () => import("@/views/pages/biomedicine/HerbSearchPage.vue"),
    meta: {
      layout: "ui",
      title: "药材检索",
      requiresAuth: true,
    },
  },
  {
    path: "/data-collection",
    component: () => import("@/views/pages/biomedicine/DataCollection.vue"),
    meta: {
      layout: "ui",
      title: "数据采集",
      requiresAuth: true, // 需要登录
    },
  },
  {
    path: "/education",
    component: () => import("@/views/pages/biomedicine/EduOnline.vue"),
    meta: {
      layout: "ui",
      title: "在线教育",
      requiresAuth: true, // 需要登录
    },
  },
  {
    path: "/biomedicine/resource-list",
    component: () => import("@/views/pages/biomedicine/ResourceList.vue"),
    meta: {
      layout: "ui",
      title: "资源列表",
      requiresAuth: false, // 不需要登录
    },
  },
  {
    path: "/biomedicine/resource-detail/:id",
    component: () => import("@/views/pages/biomedicine/ResourceDetail.vue"),
    meta: {
      layout: "ui",
      title: "资源详情",
      requiresAuth: false, // 不需要登录
    },
  },
  // ... 其他需要登录的路由也要加上 meta: { requiresAuth: true }
  {
    path: "/auth/signin",
    name: "auth-signin",
    component: () => import("@/views/auth/SigninPage.vue"),
    meta: {
      layout: "auth",
      title: "登录",
    },
  },
  {
    path: "/auth/signup",
    name: "auth-signup",
    component: () => import("@/views/auth/SignupPage.vue"),
    meta: {
      layout: "auth",
      title: "注册",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/errors/NotFoundPage.vue"),
    meta: {
      layout: "default",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

// 添加全局前置守卫
router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !tokenStore.isLoggedIn) {
    // 如果目标路由需要认证但用户未登录，则重定向到登录页
    next({ name: 'auth-signin' });
  } else {
    // 否则，正常进入
    next();
  }
});

export default router;
