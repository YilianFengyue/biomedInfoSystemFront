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
          text: "研究平台",
          link: "/research",
          icon: "mdi-school-outline",
        },
        {
          text: "多人协作板",
          link: "/board",
          icon: "mdi-draw",
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
          text: "评分判定",
          link: "/score",
          icon: "mdi-view-dashboard-outline",
        },
        {
          text: "menu.performance",
          link: "/biomedicine/performance",
          icon: "mdi-view-dashboard-outline",
        },
        {
          text: "知识图谱",
          link: "/knowledge-graph",
          icon: "mdi-graph-outline",
        },
        {
          text: "方剂管理",
          link: "/Formula",
          icon: "mdi-pill",
        }
      ],
    },
  ],
};