# 生物医药系统前端

#### 1、项目基于Vue+Vuetify+Vite;

#### 2、本项目基于 LUX-UI项目 进行修改,运用UI构建页面

#### 简要结构说明

**顶部可以直接搜索文件**

> #### MainAppBar.Vue
>
> ![image-20250517142629325](C:\Users\123\Desktop\SoftWareEngineering\房屋租赁系统\houseSystemFront\assets\image-20250517142629325.png)

> #### ToolBarUser.vue
>
> <img src="C:\Users\123\Desktop\SoftWareEngineering\房屋租赁系统\houseSystemFront\assets\image-20250517142708777.png" alt="image-20250517142708777" style="zoom:33%;" />

> #### 侧边菜单：MainSideBar.vue
>
> <img src="C:\Users\123\Desktop\SoftWareEngineering\房屋租赁系统\houseSystemFront\assets\image-20250517142821064.png" alt="image-20250517142821064" style="zoom:50%;" />

#### 菜单模块说明

```vue
<!-- ---------------------------------------------- -->
    <!---Nav List -->
    <!-- ---------------------------------------------- -->

    <main-menu :menu="navigation.menu"></main-menu>
```

##### 引用菜单组件mainmenu,在Navigation文件夹

Mainmenu自行研究（ai）一下就知道结构了~

##### navigation.vue(映射的路由地址)在这里加选项，点击会跳转对应地址

```ts
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
          text: "商品类型",
          link: "/product",
          icon: "mdi-view-dashboard-outline",
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
      ],
    },
```

Router/index.ts

```ts
{
    path: "/",
    redirect: "/dashboard",
    meta: {},
  } as any,
```

#### 映射路由地址（访问路径）

#### 一：前端开发
推荐使用build:dev + preview

#### 二：electron打包
>1.新建D:\\electron_cache目录
>2.在前端根目录下创建/backend目录，里面存放你的后端jar包
>使用mvn package打包，jar包在target目录下
>3.进入package.json，加入以下内容
```ts
"build": {
    "appId": "com.yourcompany.biomed",
    "productName": "BiomedInfoSystem",
    "copyright": "Copyright © 2025 ${author}",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "electron/**/*"
    ],
    "extraResources": [
      {
        "from": "./backend/BiomedInfoSystem-0.0.1-SNAPSHOT.jar",
        "to": "backend.jar"
      }
    ],
    "win": {
      "target": "nsis",
      "icon": "path/to/your/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "allowElevation": true,
      "createDesktopShortcut": true
    },
    "mac": {
      "target": "dmg",
      "icon": "path/to/your/icon.icns"
    }
  }
```
>4.使用powershell 输入$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
>5.$env:ELECTRON_CACHE="D:\electron_cache"
>6.npm run electron:build
>7.运行生成的dist_electron目录下的exe安装包
>8.需要运行后端，且数据库信息要一样