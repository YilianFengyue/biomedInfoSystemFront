<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <Icon icon="streamline-stickies-color:library-research" />&nbsp;
            <span class="text-h5">资源类型分布</span>
          </v-card-title>
          <v-divider></v-divider>
          <div ref="pieChartRef" style="height: 400px;"></div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="fill-height">
          <v-card-title class="d-flex align-center">
            <Icon icon="streamline-ultimate-color:ranking-people-first" />&nbsp;
            <span class="text-h5">教师业绩排行</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table
            :headers="teacherHeaders"
            :items="sortedTeachers"
            :loading="teacherLoading"
            class="elevation-1"
            items-per-page="5"
          >
            <template v-slot:item.score="{ item }">
              <v-chip color="green" dark>{{ item.score.toFixed(1) }}</v-chip>
            </template>
             <template v-slot:item.totalVideoDuration="{ item }">
              <span>{{ formatDuration(item.totalVideoDuration) }}</span>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
           <v-card-title class="d-flex align-center">
            <Icon icon="vscode-icons:folder-type-library-opened" />&nbsp;
            <span class="text-h5">我上传的资源</span>
          </v-card-title>
           <v-divider></v-divider>
          <div v-if="resourceLoading" class="text-center pa-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>
          <div v-else>
            <ResourceCardList :resources="userResources" />
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, type Ref } from 'vue';
import axios from 'axios';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useProfileStore } from '@/stores/profileStore';
import { useChart, RenderType } from "@/plugins/echarts";
import type { EChartsOption } from "echarts";
import { Icon } from "@iconify/vue";
import ResourceCardList from '@/views/pages/biomedicine/ResourceCardList.vue'; // 复用这个组件

// --- Store & Utils ---
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();

// --- 类型定义 ---
interface TeacherScore {
  teacherId: number;
  teacherName: string;
  score: number;
  totalLikes: number;
  totalVideoDuration: number;
  totalResources: number;
}

interface UserResource {
  id: number;
  title: string;
  resourceType: 'text' | 'video';
  coverImageUrl: string | null;
  createdAt: string;
  duration?: number;
  videoUrl?: string;
  categoryName?: string;
}

// --- 状态 ---
const teachers = ref<TeacherScore[]>([]);
const teacherLoading = ref(true);

const userResources = ref<any[]>([]);
const resourceLoading = ref(true);

const pieChartRef = ref<HTMLDivElement | null>(null);
const { setOption: setPieChartOption } = useChart(pieChartRef as Ref<HTMLDivElement>, true, false, RenderType.SVGRenderer);

// --- 表格头部 ---
const teacherHeaders = [
  { title: '排名', key: 'rank', sortable: false },
  { title: '教师姓名', key: 'teacherName' },
  { title: '考核分数', key: 'score' },
  { title: '总点赞数', key: 'totalLikes' },
  { title: '总视频时长', key: 'totalVideoDuration' },
  { title: '总资源数', key: 'totalResources' },
];

// --- 计算属性 ---
const sortedTeachers = computed(() => {
  return [...teachers.value]
    .sort((a, b) => b.score - a.score)
    .map((teacher, index) => ({ ...teacher, rank: index + 1 }));
});

// --- API 调用 ---
const fetchAllTeachersScores = async () => {
  teacherLoading.value = true;
  try {
    const response = await axios.get('/api/teachers/scores');
    if (response.data.code === 20041) {
      teachers.value = response.data.data;
    } else {
      snackbarStore.showErrorMessage('获取教师列表失败: ' + response.data.msg);
    }
  } catch (error) {
    snackbarStore.showErrorMessage('请求教师列表失败');
    console.error(error);
  } finally {
    teacherLoading.value = false;
  }
};

const fetchUserResources = async () => {
  resourceLoading.value = true;
  const userId = profileStore.user?.id || 111; // 默认用111作为测试
  try {
    const response = await axios.get(`/api/users/${userId}/resources`);
    if (response.data.code === 20000) {
      // 转换数据以适配ResourceCardList组件
      userResources.value = response.data.data.map((res: UserResource) => ({
        id: res.id,
        type: res.resourceType,
        title: res.title,
        coverImageUrl: res.coverImageUrl,
        description: res.categoryName || (res.resourceType === 'video' ? '视频资源' : '图文资源'),
        authorName: profileStore.user?.nickname || '我',
        createdAt: res.createdAt,
        videoUrl: res.videoUrl,
        detailUrl: res.resourceType === 'video' ? `/biomedicine/VideoDetail/${res.id}` : `/biomedicine/resource-detail/${res.id}`
      }));
    } else {
      snackbarStore.showErrorMessage('获取用户资源失败: ' + response.data.msg);
    }
  } catch (error) {
    snackbarStore.showErrorMessage('请求用户资源失败');
    console.error(error);
  } finally {
    resourceLoading.value = false;
  }
};

const fetchAllResourcesForChart = async () => {
  try {
    const [textRes, videoRes] = await Promise.all([
      axios.get('/api/edu/resources'),
      axios.get('/api/videos/page')
    ]);

    const textCount = textRes.data.data?.length || 0;
    const videoCount = videoRes.data.data?.totalElements || 0;

    const pieData = [
      { value: textCount, name: '图文资源' },
      { value: videoCount, name: '视频资源' },
    ];
    updatePieChart(pieData);
  } catch (error) {
    console.error('获取图表数据失败:', error);
  }
};

// --- ECharts ---
const updatePieChart = (data: { value: number, name: string }[]) => {
  const pieOption: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '资源类型',
        type: 'pie',
        radius: '70%',
        center: ['50%', '60%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  setPieChartOption(pieOption);
};

// --- 工具函数 ---
const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchAllTeachersScores();
  fetchUserResources();
  fetchAllResourcesForChart();
});
</script>

<style scoped>
.fill-height {
  height: 100%;
}
</style>