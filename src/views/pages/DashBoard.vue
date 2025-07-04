<template>
  <v-container fluid class="pa-0">
    <section class="hero-section">
      <v-row no-gutters class="h-100">
        <v-col cols="12" class="pa-0 h-100">
          <v-card rounded="0" class="h-100">
            <v-carousel cycle height="100%" hide-delimiter-background show-arrows="hover">
              <v-carousel-item v-for="(item, i) in carouselItems" :key="i" :src="item.src" cover>
                <div class="fill-height d-flex align-center justify-center text-center carousel-overlay">
                  <v-row justify="center">
                    <v-col cols="12" md="10">
                      <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-4 hero-title">
                        生物医药信息系统
                      </h1>
                      <p class="text-h6 text-md-h5 font-weight-light text-white mb-8 hero-subtitle">
                        致力于提供专业、全面的生物医药数据与前沿资讯
                      </p>
                    </v-col>
                  </v-row>
                </div>
              </v-carousel-item>
            </v-carousel>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <div class="px-4 px-md-6 mt-6">
      <v-row>
        <v-col v-for="(feature, i) in features" :key="i" cols="12" md="4">
          <v-card @click="navigateTo(feature.route)" hover rounded="lg"
            class="text-center pa-6 fill-height d-flex flex-column align-center justify-center feature-card">
            <v-img :src="feature.icon" :alt="feature.title" height="80" width="80" contain class="mb-4"></v-img>
            <v-card-title class="text-h5 font-weight-bold mt-4">
              {{ feature.title }}
            </v-card-title>
            <v-card-text class="text-body-1">
              {{ feature.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-6">
        <v-col cols="12" md="5" class="d-flex align-center justify-center">
          <v-img
            :src="doctorSvg"
            alt="Doctor Illustration"
            contain
            max-height="300"
            class="pa-4"
          />
        </v-col>

        <v-col cols="12" md="7">
          <v-card rounded="lg" class="fill-height">
            <v-card-title class="d-flex align-center title-green">
              <v-icon color="primary" class="mr-2">mdi-star-box</v-icon>
              <span class="text-h5 font-weight-bold">精选热门资源</span>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <v-list lines="one">
                <v-list-item v-if="loadingResources" class="text-center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </v-list-item>
                <v-list-item v-for="resource in featuredResources" :key="resource.id"
                  @click="navigateTo(resource.detailUrl)" class="resource-list-item">
                  <template v-slot:prepend>
                    <v-icon :color="resource.type === 'video' ? 'red' : 'blue'">
                      {{ resource.type === 'video' ? 'mdi-youtube-tv' : 'mdi-file-document-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ resource.title }}</v-list-item-title>
                  <template v-slot:append>
                    <v-icon>mdi-chevron-right</v-icon>
                  </template>
                </v-list-item>
                <v-list-item v-if="!loadingResources && featuredResources.length === 0">
                  <v-list-item-title class="text-center text-grey">暂无热门资源</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <v-row class="mt-6">
        <v-col cols="12" md="5">
            <v-card class="fill-height" rounded="lg">
                <v-card-title class="d-flex align-center title-yellow">
                    <v-icon color="primary" class="mr-2">mdi-leaf</v-icon>
                    <span class="text-h5 font-weight-bold">今日养生</span>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-5">
                    <p class="text-h6 mb-1">{{ seasonalInfo.gregorianDate }}</p>
                    <p class="text-body-1 text-grey-darken-2">
                        {{ seasonalInfo.lunarDate }}
                        <v-chip color="primary" label size="small" class="ml-2">{{ seasonalInfo.solarTerm }}</v-chip>
                    </p>
                    <v-divider class="my-4"></v-divider>
                    <h3 class="text-subtitle-1 font-weight-bold mb-3">当季滋补推荐</h3>
                    <div v-if="seasonalInfo.recommendations.length > 0">
                        <v-chip v-for="item in seasonalInfo.recommendations" :key="item" color="teal" class="mr-2 mb-2">
                            {{ item }}
                        </v-chip>
                    </div>
                     <div v-else class="text-grey">
                        暂无推荐
                    </div>
                </v-card-text>
            </v-card>
        </v-col>
        <v-col cols="12" md="7" class="d-flex align-center justify-center">
             <v-img
                :src="seasonalSvg"
                alt="Healthy Lifestyle Illustration"
                contain
                max-height="250"
                class="pa-4"
            />
        </v-col>
      </v-row>

    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import solarLunar from 'solarlunar';

// Importing assets for carousel and illustrations
import main1 from '@/assets/edu/main1.jpg';
import main2 from '@/assets/edu/main2.jpg';
import main3 from '@/assets/edu/main3.jpg';
import doctorSvg from '@/assets/svg/undraw_doctor_aum1.svg';
import dataCenterSvg from '@/assets/svg/undraw_algorithm-execution_rksm.svg';
import herbSearchSvg from '@/assets/svg/undraw_environment_9luj.svg';
import eduOnlineSvg from '@/assets/svg/undraw_educator_6dgp.svg';
import seasonalSvg from '@/assets/svg/undraw_online-calendar_zaoc.svg';


const router = useRouter();

// --- Data for UI Elements ---

const carouselItems = ref([
  { src: main1 },
  { src: main2 },
  { src: main3 },
]);

const features = ref([
  {
    title: '01 数据中心',
    description: '查看药材地理分布与数据总览',
    icon: dataCenterSvg,
    color: 'blue-darken-2',
    route: '/dataCenter'
  },
  {
    title: '02 药材检索',
    description: '检索和管理详细的药材信息',
    icon: herbSearchSvg,
    color: 'teal-darken-2',
    route: '/herb-search'
  },
  {
    title: '03 在线教育',
    description: '探索丰富的教学视频与图文资源',
    icon: eduOnlineSvg,
    color: 'orange-darken-2',
    route: '/education'
  }
]);

// --- Data Fetching for Featured Resources ---

interface EduResource {
  id: number;
  title: string;
  authorName: string;
  createdAt: string;
  type: 'text' | 'video';
  detailUrl: string;
  // Fields from raw API responses
  coverImageUrl?: string;
  coverUrl?: string; // from video
  status?: string;
  uploaderName?: string; // from video
}

const featuredResources = ref<EduResource[]>([]);
const loadingResources = ref(true);

const fetchFeaturedResources = async () => {
  loadingResources.value = true;
  try {
    const [textResponse, videoResponse] = await Promise.all([
      fetch('/api/edu/resources/page?pageNum=1&pageSize=10'), // Using page endpoint for consistency
      fetch('/api/videos/page?pageNum=1&pageSize=10')
    ]);

    let combinedList: EduResource[] = [];

    // Process Text Resources
    if (textResponse.ok) {
        const textResult = await textResponse.json();
        if (textResult.code === 20000 && textResult.data?.records) {
            const textResources = textResult.data.records
                .filter((r: any) => r.status !== 'draft')
                .map((r: any): EduResource => ({
                    id: r.id,
                    title: r.title,
                    authorName: r.authorName,
                    createdAt: r.createdAt,
                    type: 'text',
                    detailUrl: `/biomedicine/resource-detail/${r.id}`
                }));
            combinedList.push(...textResources);
        }
    }

    // Process Video Resources
    if (videoResponse.ok) {
        const videoResult = await videoResponse.json();
        if (videoResult.code === 20000 && videoResult.data?.content) {
            const videoResources = videoResult.data.content
                .filter((v: any) => v.status !== 'draft')
                .map((v: any): EduResource => ({
                    id: v.id,
                    title: v.title,
                    authorName: v.uploaderName || '上传者',
                    createdAt: v.createdAt,
                    type: 'video',
                    detailUrl: `/biomedicine/VideoDetail/${v.id}`
                }));
            combinedList.push(...videoResources);
        }
    }

    // Sort by date and get the top 5
    featuredResources.value = combinedList
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

  } catch (error) {
    console.error('请求精选资源时出错:', error);
  } finally {
    loadingResources.value = false;
  }
};

// --- Seasonal Health Info ---
const seasonalInfo = reactive({
    gregorianDate: '',
    lunarDate: '',
    solarTerm: '无节气',
    recommendations: [] as string[],
});

const getSeasonalInfo = () => {
    const today = new Date();
    const solar2lunarData = solarLunar.solar2lunar(today.getFullYear(), today.getMonth() + 1, today.getDate());

    seasonalInfo.gregorianDate = `今日：${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    seasonalInfo.lunarDate = `农历：${solar2lunarData.monthCn}${solar2lunarData.dayCn}`;
    if (solar2lunarData.term) {
        seasonalInfo.solarTerm = solar2lunarData.term;
    }

    const month = today.getMonth() + 1;
    if (month >= 3 && month <= 5) {
        seasonalInfo.recommendations = ['枸杞', '菊花', '薄荷', '山药'];
    } else if (month >= 6 && month <= 8) {
        seasonalInfo.recommendations = ['金银花', '荷叶', '绿豆', '西瓜翠衣'];
    } else if (month >= 9 && month <= 11) {
        seasonalInfo.recommendations = ['百合', '银耳', '沙参', '玉竹'];
    } else {
        seasonalInfo.recommendations = ['当归', '黄芪', '红枣', '生姜'];
    }
};


// --- Navigation ---
const navigateTo = (path: string) => {
  if (path) {
    router.push(path);
  }
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchFeaturedResources();
  getSeasonalInfo();
});
</script>

<style scoped>
/* 新增：参考 EduOnline.vue 的样式 */
.hero-section {
  height: 60vh;
  min-height: 500px;
  position: relative;
}

.carousel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
}

.hero-title, .hero-subtitle {
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.feature-card {
  cursor: pointer;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.resource-list-item {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease-out;
}

.resource-list-item:last-child {
    border-bottom: none;
}

.resource-list-item:hover {
  background-color: #f5f5f5;
  cursor: pointer;
}

/* 新增：为标题栏添加背景色 */
.title-green {
  background-color: #F1F8E9; /* 浅绿色 */
}

.title-yellow {
  background-color: #FFFDE7; /* 浅黄色 */
}
</style>