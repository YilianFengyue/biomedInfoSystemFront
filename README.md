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

#### 前端使用须知
#### 一：前端开发
>1.在终端输入$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
>
>2.再yarn install
>
>3.跑项目时推荐使用build:dev + preview

#### 二: electron打包流程(打包前后端+数据库)
#### 2.1 打包后端及数据库
>1.在前端根目录下创建/backend目录，里面再创建一个/jre目录
>
>2.打开终端 输入jlink --module-path "C:\Program Files\Java\jdk-23\jmods" --add-modules java.base,java.compiler,java.desktop,java.instrument,java.logging,java.management,java.naming,java.net.http,java.scripting,java.security.jgss,java.security.sasl,java.sql,java.sql.rowset,java.transaction.xa,java.xml,java.xml.crypto,jdk.unsupported --output D:\my-new-jre --strip-debug --no-header-files --no-man-pages --compress=2
>
>这个能导出你的jre到\my-new-jre目录(你也能自己更改)，把里面的东西复制到/backend/jre目录下
>
>3.如果你是用的是mysql数据库，导出你的sql文件，需要改为h2语法(可以让ai帮你改)，分为schema.sql(创建表)，data.sql(插入数据)，放在/resources和/test/resources下，并且两个的application.yaml都要修改(请根据自己项目的实际情况进行修改)
>
>例如:
````ts
# 服务器端口，你的 Electron 应用将访问这个端口
server:
  port: 81
  servlet:
  # --- 添加这一行！ ---
    context-path: /api

# Spring Boot 的核心配置
spring:
  flyway:
    enabled: false # 禁用 Flyway
  # --- 数据源核心配置 ---
  datasource:
    # 1. 使用 H2 的驱动
    driver-class-name: org.h2.Driver
    # 2. 这是关键！配置数据库为文件模式，并开启 MySQL 兼容模式
    #    - jdbc:h2:file:./data/biomed_info_system 表示在 Jar 包运行的目录下，创建一个 data 文件夹，并在里面生成一个数据库文件。
    #    - MODE=MySQL; 表示开启 MySQL 兼容模式。
    #    - CASE_INSENSITIVE_IDENTIFIERS=TRUE; 建议开启，让表名和字段名不区分大小写，更像 MySQL。
    url: jdbc:h2:file:./data/biomed_info_system;MODE=MySQL;CASE_INSENSITIVE_IDENTIFIERS=TRUE;
    # 3. H2 的用户名和密码（可自定义）
    username: sa
    password: password

  # --- Spring Boot JPA/Hibernate 配置 (如果你也用了) ---
  jpa:
  # 告诉 Hibernate 使用 H2 的 MySQL 方言
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update # 自动更新表结构

  # --- SQL 初始化配置 ---
  # Spring Boot 会自动加载并执行 schema.sql 和 data.sql 文件
  sql:
    init:
      mode: always # 保证每次启动都尝试执行初始化脚本
````
>和
````ts
# ===============================================
# ============  测试环境专属配置  ============
# ===============================================
spring:
  # --- 为测试使用一个干净的、独立的内存数据库 ---
  datasource:
    url: jdbc:h2:mem:testdb;MODE=MySQL
    driver-class-name: org.h2.Driver
    username: sa
    password: password
  flyway:
    enabled: false # 禁用 Flyway

  # --- 关键！告诉测试环境不要执行任何 .sql 文件 ---
  sql:
    init:
      mode: never

  # --- 让测试自动创建和销毁表结构 ---
  jpa:
    hibernate:
      ddl-auto: create-drop
````
>
>4.然后使用mvn clean package -DskipTests命令导出jar包，把jar包复制到/backend目录下

#### 2.2 打包前端
>1.新建D:\\electron_cache目录
>
>2.进入package.json，加入以下内容
```ts
"build": {
    "appId": "com.yourcompany.biomed",
    "productName": "BiomedInfoSystem",
    "copyright": "Copyright © 2025 ${author}",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "electron/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "backend",
        "to": "backend"
      }
    ],
    "win": {
      "target": "nsis",
      "icon": "electron/icons/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    },
    "mac": {
      "target": "dmg",
      "icon": "electron/icons/icon.icns"
    }
  }
```
>
>3.进入vite.config.ts
在defineConfig中添加base: './',将资源路径改为相对路径
>
>4.使用powershell 输入$env:ELECTRON_MIRROR="https://registry.npmmirror.com/-/binary/electron/"
>
>5.$env:ELECTRON_CACHE="D:\electron_cache"
>
>6.npm run electron:build
>
>7.可以在dist-electron/resources/backend目录下使用终端输入
jre\bin\java.exe -jar BiomedInfoSystem-0.0.1-SNAPSHOT.jar来测试是否打包的后端报错
>
>8.运行生成的dist_electron目录下的exe安装包
>
>9.现在安装完的软件不用运行后端和数据库了，但是有些功能可能会消失或报错，请根据实际情况修改
>
>10.在C:\Users\你的用户名\AppData\Roaming里有一个backend-log.txt(没有可以搜索一下)，里面有报错信息
>
>11.这个教程是根据前后端分离(vue3+springboot+mysql)制定，可能稍有不同

#### 三：只打包前端
>如果未来你部署了后端，数据库，redis等，或是你电脑上可以运行后端和数据库，那么可以只打包前端(应该说这才是主流方式)
>
>1.请修改你前端项目根目录下的 .env.production 文件。这个文件里的 VITE_API_BASE_URL 
变量决定了你的桌面应用要去连接哪个服务器，填写你部署在云服务器上的后端域名(注意不要留空格)。
>
>2.简化 electron/main.js 文件
>
>3.简化 package.json 中的 build 配置
````ts
"build": {
    "appId": "com.yourcompany.biomed",
    "productName": "BiomedInfoSystem",
    "copyright": "Copyright © 2025 ${author}",
    "directories": {
      "output": "dist_electron"
    },
    "files": [
      "electron/**/*", // 只需要打包包含 main.js 和 dist 的 electron 文件夹
      "package.json"
    ],
    "win": {
      "target": "nsis",
      "icon": "electron/icons/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
````
