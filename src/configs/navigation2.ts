import menuLanding from "./menus/landing.menu";
import menuUI from "./menus/ui.menu";
import menuPages from "./menus/pages.menu";

export default {
  menu: [
    {
      text: "",
      items: [
        {
          text: "主页",
          link: "/dashboard",
          icon: "mdi-view-dashboard-outline",
        },
        {
          text: "数据中心",
          link: "/dataCenter",
          icon: "mdi-school-outline",
        },
        {
          text: "药材检索",
          link: "/herb-search",
          icon: "mdi-school-outline",
        },
        {
          text: "数据采集",
          link: "/data-collection",
          icon: "mdi-school-outline",
        },
        {
          text: "在线教育",
          link: "/education",
          icon: "mdi-school-outline",
        },
        {
          text: "新闻编辑",
          link: "/newsEditor",
          icon: "mdi-file-document-edit-outline",
        },
        {
          icon: "mdi-robot-excited-outline",
          text: "AI选购顾问",
          link: "/ai/chatbot_v1",
        },
        {
          icon: "mdi-robot-outline",
          text: "Image Bot",
          link: "/image-bot",
        },
        {
          icon: "mdi-robot-outline",
          text: "植物识别",
          link: "/plant-recognition",
        },
      ],
    },
    // 如果你需要保留这些菜单组，可以取消注释
    // {
    //   text: "Landing",
    //   items: [
    //     ...menuLanding,
    //   ],
    // },
    // {
    //   text: "UI - Theme Preview",
    //   items: menuUI,
    // },
    // {
    //   text: "Pages",
    //   items: menuPages,
    // },
  ],
};