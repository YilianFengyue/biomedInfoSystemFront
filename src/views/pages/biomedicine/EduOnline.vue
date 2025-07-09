<template>
  <v-app>
    <v-app-bar app color="white" flat elevation="2">
      <v-container class="d-flex align-center py-0 px-2">
        <v-toolbar-title class="d-flex align-center font-weight-bold" style="cursor: pointer;">
          <v-icon color="#BBC23F" class="mr-2">mdi-leaf-circle</v-icon>
          <span style="color: #BBC23F;">本草学堂</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <div class="d-none d-md-flex">
          <v-btn text class="font-weight-medium" @click="router.push('/dashboard')">首页</v-btn>
          <v-btn text class="font-weight-medium" @click="scrollTo('courses')">课程列表</v-btn>
          <v-btn text class="font-weight-medium" @click="scrollTo('teachers')">名师团队</v-btn>
        </div>
        <v-spacer></v-spacer>
        <v-btn icon class="d-none d-md-flex">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <v-app-bar-nav-icon class="d-md-none" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary app location="right">
       <v-list>
        <v-list-item link title="首页" @click="router.push('/dashboard')"></v-list-item>
        <v-list-item link title="课程列表" @click="scrollTo('courses')"></v-list-item>
        <v-list-item link title="名师团队" @click="scrollTo('teachers')"></v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="bg-grey-lighten-5">
      <section class="hero-section">
        <v-carousel
            cycle
            height="100%"
            hide-delimiter-background
            show-arrows="hover"
            class="hero-carousel"
        >
          <v-carousel-item
              v-for="(item, i) in carouselItems"
              :key="i"
              :src="item.src"
              cover
          >
            <div class="fill-height d-flex align-center justify-center text-center content-overlay">
              <v-row justify="center">
                <v-col cols="12" md="10">
                  <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-4 hero-title">
                    传承千载中医智慧，开启本草探索之旅
                  </h1>
                  <p class="text-h6 text-md-h5 font-weight-light text-white mb-8 hero-subtitle">
                    系统化学习中医药材知识，与名师一同辨识、理解、运用本草精华。
                  </p>
                  <v-btn size="x-large" color="#B0D183" elevation="4" @click="scrollTo('courses')">
                    <v-icon left class="mr-2">mdi-school</v-icon>
                    立即开始学习
                  </v-btn>
                </v-col>
              </v-row>
            </div>
          </v-carousel-item>
        </v-carousel>
      </section>

      <section class="py-10">
        <v-container>
          <v-row>
            <v-col v-for="feature in features" :key="feature.title" cols="12" sm="4">
              <v-card class="text-center pa-4 feature-card" flat color="transparent"
                      @click="feature.clickHandler&&feature.clickHandler()"
                      :style="{cursor: feature.clickHandler?'pointer':'default'}"
              >
                <v-icon :color="feature.color" size="64">{{ feature.icon }}</v-icon>
                <h3 class="text-h6 font-weight-bold mt-4 mb-2">{{ feature.title }}</h3>
                <p class="text-body-1 text-grey-darken-2">{{ feature.description }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <section class="py-10">

        <v-container fluid> <CoursesPage /></v-container>

      </section>


      <section id="courses" class="py-10 bg-white">
        <v-container>
          <div class="d-flex align-center mb-8">
            <h2 class="text-h4 font-weight-bold">精选热门资源</h2>
            <v-spacer></v-spacer>
            <v-btn
              color="#B0D183"
              variant="text"
              @click="router.push('/biomedicine/resource-list')"
            >
              查看更多
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
          <ResourceCardList :resources="featuredCourses" />
        </v-container>
      </section>

      <section id="teachers" class="py-10">
        <v-container>
          <h2 class="text-h4 font-weight-bold text-center mb-8">权威名师团队</h2>
          <v-row justify="center">
            <v-col v-for="teacher in featuredTeachers" :key="teacher.id" cols="12" sm="6" md="3">
              <v-card class="text-center pa-4" flat>
                <v-avatar size="120" class="mb-4" elevation="3">
                  <v-img :src="teacher.avatarUrl" :alt="teacher.nickname">
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                      </div>
                    </template>
                  </v-img>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold">{{ teacher.nickname || teacher.username }}</h3>
                <p class="text-body-1 font-weight-medium" style="color: #BBC23F;">{{ teacher.bio || '资深中医药学专家' }}</p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>
    </v-main>

    <!--<v-footer class="pa-md-10 pa-5" color="grey-lighten-5">
  <v-container>
    <h2 class="text-h4 font-weight-bold text-center mb-8" style="color: #B0D183;">
      开发团队
    </h2>

    <v-row justify="center">
      <v-col
        v-for="member in team"
        :key="member.name"
        cols="12"
        sm="6"
        md="4"
        lg="2"
      >
        <v-card class="text-center pa-4" flat color="transparent">
          <v-avatar size="100" class="mb-3">
            <v-img :src="member.avatar" :alt="member.name" cover></v-img>
          </v-avatar>
          <div class="text-h6 font-weight-bold">{{ member.name }}</div>
          <div class="text-body-2 text-grey-darken-1 mb-2">{{ member.role }}</div>
          <div>
            <v-btn
              v-for="social in member.socials"
              :key="social.icon"
              :href="social.link"
              target="_blank"
              icon
              variant="text"
              size="small"
              color="grey-darken-1"
            >
              <v-icon :icon="social.icon"></v-icon>
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="my-6"></v-divider>
    <div class="text-center text-caption text-grey">
      &copy; {{ new Date().getFullYear() }} 本草学堂. 保留所有权利.
    </div>
  </v-container>
</v-footer>-->

    
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ResourceCardList from '@/views/pages/biomedicine/ResourceCardList.vue';

import main1 from '@/assets/edu/main1.jpg';
import main2 from '@/assets/edu/main2.jpg';
import main3 from '@/assets/edu/main3.jpg';

import CoursesPage from '@/views/pages/biomedicine/CoursesPage.vue';

const router = useRouter();

interface Teacher {
  id: number;
  username: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
}

interface EduResource {
  id: number;
  title: string;
  coverImageUrl: string;
  content?: string; // 视频可能没有content
  authorId: number;
  authorName: string;
  status: string;
  createdAt: string;
  type?: 'text' | 'video';
  description?: string;
  videoUrl?: string;
  detailUrl?: string;
  uploaderName?: string; // 视频上传者
  coverUrl?: string; // 视频封面
}

const drawer = ref(false);
const featuredTeachers = ref<Teacher[]>([]);
const featuredCourses = ref<EduResource[]>([]);

const scrollTo = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
  drawer.value = false;
};

const carouselItems = ref([
  { src: main1 },
  { src: main2 },
  { src: main3 },
]);

const features = ref([
  { title: '教学资源上传',
  description: '上传您的个人课程，相互交流学术问题。',
  icon: 'mdi-human-male-board',
  color: '#B0D183' ,
  clickHandler: () => { router.push('/biomedicine/eduupload'); }
  },
  {
    title: '海量药材图谱',
    description: '高清、多角度的药材图片库，辅助精准辨识。',
    icon: 'mdi-image-multiple',
    color: '#BBC23F',
    clickHandler: () => { router.push('/herb-search'); }
  },
  { title: '系统化学习路径',
    description: '从入门到精通，为您规划最科学的学习方案。',
    icon: 'mdi-sitemap',
    color: '#BCA881' ,
    clickHandler: () => { router.push('/biomedicine/eduplan'); }
  }
]);

/*const footerIcons = ref([
  'mdi-wechat',
  'mdi-qqchat',
  'mdi-sina-weibo',
  'mdi-youtube'
]);*/
import Lin from '@/assets/images/avatars/Lin.jpg';
import Wang from '@/assets/images/avatars/Wang.jpg';
import Lu from '@/assets/images/avatars/Lu.jpg';
import Shang from '@/assets/images/avatars/Shang.jpg';
import Zhang from '@/assets/images/avatars/Zhang.jpg';
const team = ref([
  {
    name: '王银波',
    role: '项目经理 & 全栈开发',
    avatar: Wang,
    socials: [
      { icon: 'mdi-github', link: 'https://github.com/YilianFengyue' },
      { icon: 'mdi-linkedin', link: 'https://linkedin.com' },
    ],
  },
  {
    name: '陆岳',
    role: '前端架构师 & UI设计',
    avatar: Lu,
    socials: [
      { icon: 'mdi-github', link: 'https://github.com/rg2304luyue' },
      { icon: 'mdi-linkedin', link: 'https://linkedin.com' },
    ],
  },
  {
    name: '林文浩',
    role: '安卓开发&前端工程师',
    avatar: Lin,
    socials: [
      { icon: 'mdi-github', link: 'https://github.com/Andyiscpp' },
      { icon: 'mdi-linkedin', link: 'https://linkedin.com' },
    ],
  },
  {
    name: '张家豪',
    role: '后端工程师 & 运维',
    avatar: Zhang,
    socials: [
      { icon: 'mdi-github', link: 'https://github.com/ewewrttt' },
      { icon: 'mdi-linkedin', link: 'https://linkedin.com' },
    ],
  },
  {
    name: '尚思宇',
    role: '后端工程师 & WinUI',
    avatar: Shang,
    socials: [
      { icon: 'mdi-github', link: 'https://github.com/dashboard' },
      { icon: 'mdi-linkedin', link: 'https://linkedin.com' },
    ],
  },
]);

const fetchTeachers = async () => {
  try {
    const response = await fetch('/api/users/teachers');
    if (!response.ok) throw new Error('网络请求失败');
    const result = await response.json();
    if (result.code === 20000 && result.data) {
      featuredTeachers.value = result.data;
    } else {
      console.error('获取教师数据失败:', result.msg);
    }
  } catch (error) {
    console.error('请求教师数据时出错:', error);
  }
};

const fetchFeaturedCourses = async () => {
  try {
    // 两个API都请求状态为'published'的资源
    const [textResponse, videoResponse] = await Promise.all([
      fetch('/api/resources?status=published&pageSize=10'),
      fetch('/api/videos/page?status=published&pageSize=10')
    ]);

    let combinedList: EduResource[] = [];

    if (textResponse.ok) {
        const textResult = await textResponse.json();
        if (textResult.code === 20000 && textResult.data?.content) {
            // 【关键修改】在客户端再次过滤，确保只处理 'published' 状态的资源
            const textResources = textResult.data.content
                .filter((r: EduResource) => r.status === 'published')
                .map((r: EduResource) => ({ ...r, type: 'text', detailUrl: `/biomedicine/resource-detail/${r.id}` }));
            combinedList.push(...textResources);
        }
    }

    if (videoResponse.ok) {
        const videoResult = await videoResponse.json();
        if (videoResult.code === 20000 && videoResult.data?.content) {
            // 【关键修改】在客户端再次过滤，确保只处理 'published' 状态的资源
            const videoResources = videoResult.data.content
                .filter((v: EduResource) => v.status === 'published')
                .map((v: EduResource) => ({ ...v, type: 'video', coverImageUrl: v.coverUrl, authorName: v.uploaderName, detailUrl: `/biomedicine/VideoDetail/${v.id}` }));
            combinedList.push(...videoResources);
        }
    }

    // 在合并后的列表中按创建时间降序排序，并截取最新的前3条作为精选资源
    featuredCourses.value = combinedList
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

  } catch (error) {
    console.error('请求精选资源时出错:', error);
  }
};


onMounted(() => {
  fetchTeachers();
  fetchFeaturedCourses();
});
</script>

<style scoped>
.hero-section {
  height: 60vh;
  min-height: 400px;
  position: relative;
}

.hero-carousel {
  height: 100%;
}

.content-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
}

.hero-title {
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.hero-subtitle {
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
}

.feature-card {
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.feature-card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
</style>
