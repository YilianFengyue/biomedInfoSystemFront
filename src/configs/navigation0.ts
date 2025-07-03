import menuLanding from "./menus/landing.menu";
import menuUI from "./menus/ui.menu";
import menuPages from "./menus/pages.menu";

export default {
  menu: [
    {
      text: "",
      items: [
        {
          text: "menu.dashboard",
          link: "/dashboard",
          icon: "mdi-view-dashboard-outline",
        },
        {
          text: "menu.dataCenter",
          link: "/dataCenter",
          icon: "mdi-school-outline",
        },
        {
          text: "menu.herb_search",
          link: "/herb-search",
          icon: "mdi-school-outline",
        },
        {
          text: "menu.data_collection",
          link: "/data-collection",
          icon: "mdi-school-outline",
        },
        {
          text: "menu.education",
          link: "/education",
          icon: "mdi-school-outline",
        },
        {
          text: "menu.performance",
          link: "/biomedicine/performance",
          icon: "mdi-view-dashboard-outline",
        },
        {
          text: "menu.admin",
          link: "/admin",
          icon: "mdi-android-studio",
        },
        {
          text: "menu.newsEditor",
          link: "/newsEditor",
          icon: "mdi-file-document-edit-outline",
        },
        {
          text: "menu.newsList",
          link: "/newsList",
          icon: "mdi-message-text-outline",
        },
        {
          icon: "mdi-robot-excited-outline",
          text: "menu.chatbot",
          link: "/ai/chatbot_v1",
        },
        {
          icon: "mdi-robot-outline",
          text: "Image Bot",
          link: "/image-bot",
        },
        {
          icon: "mdi-robot-outline",
          text: "menu.plant_recognition",
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