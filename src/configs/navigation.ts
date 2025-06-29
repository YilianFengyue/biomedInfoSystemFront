export default {
  menu: [
    {
      text: "核心功能",
      items: [
        {
          text: "数据中心",
          link: "/dashboard",
          icon: "mdi-view-dashboard-outline",
        },
        // --- 新增的导航项 ---
        {
          text: "药材检索",
          link: "/herb-search",
          icon: "mdi-magnify",
        },
        {
          text: "数据采集",
          link: "/data-collection",
          icon: "mdi-database-plus-outline",
        },
        {
          text: "在线教育",
          link: "/education",
          icon: "mdi-school-outline",
        },
        {
          text: "业绩认定",
          link: "/evaluation",
          icon: "mdi-clipboard-check-outline",
        },
         {
          text: "后台管理",
          link: "/admin",
          icon: "mdi-tune",
        },
        {
          text: "个人中心",
          link: "/profile",
          icon: "mdi-account-circle-outline",
        },
      ],
    },
     {
      text: "AI 助手",
      items: [
        {
            icon: "mdi-robot-excited-outline",
            text: "AI 顾问",
            link: "/ai/chatbot_v1",
        },
      ]
     }
  ],
};

