<template>
  <v-container
    fluid
    class="pa-md-6 pa-4"
  >
    <div
      v-if="isLoading"
      class="text-center pa-16"
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <p class="mt-4 text-grey">正在加载药材数据...</p>
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      title="加载失败"
      :text="error"
      variant="tonal"
      class="my-5"
    >
        <template v-slot:append>
            <v-btn @click="goBack" color="error">返回列表</v-btn>
        </template>
    </v-alert>

    <template v-else-if="herbData">
        <v-card
          rounded="lg"
          border
          class="mb-6"
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon
              class="mr-3"
              color="primary"
            >mdi-pencil-box-outline</v-icon>
            <span class="text-h5 font-weight-bold text-grey-darken-3">编辑药材基本信息</span>
            <v-spacer></v-spacer>
            <v-chip
              color="primary"
              label
            >ID: {{ herbData.id }}</v-chip>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text>
            <v-form v-model="isFormValid">
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="herbData.name"
                    label="药材名称"
                    :rules="[rules.required]"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="herbData.scientificName"
                    label="学名"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="herbData.familyName"
                    label="科名"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="herbData.lifeForm"
                    label="生活类型"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="herbData.resourceType"
                    :items="['野生', '栽培']"
                    label="资源类型"
                    variant="outlined"
                    density="compact"
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="herbData.description"
                    label="简介/药用价值描述"
                    variant="outlined"
                    rows="3"
                    auto-grow
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card
          rounded="lg"
          border
        >
          <v-card-title class="d-flex align-center pa-4">
            <v-icon
              class="mr-3"
              color="teal"
            >mdi-sprout-outline</v-icon>
            <span class="text-h5 font-weight-bold text-grey-darken-3">编辑生长信息</span>
          </v-card-title>
          <v-divider></v-divider>

          <div
            v-if="growthDataList.length > 0"
            class="pa-4"
          >
            <div
              v-for="(growthItem, index) in growthDataList"
              :key="growthItem.growthDataId"
              class="mb-4"
            >
              <v-card variant="outlined">
                <v-card-text>
                  <p class="text-subtitle-1 font-weight-medium mb-2">
                    {{ growthItem.address || '未知地点' }} - <span class="text-grey-darken-1">{{ growthItem.metricName }}</span>
                  </p>
                  <v-row dense>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <v-text-field
                        v-model="growthItem.metricValue"
                        label="指标值"
                        density="compact"
                        variant="solo-filled"
                        flat
                        bg-color="grey-lighten-4"
                      ></v-text-field>
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <v-text-field
                        v-model="growthItem.metricUnit"
                        label="指标单位"
                        density="compact"
                        variant="solo-filled"
                        flat
                        bg-color="grey-lighten-4"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
              <v-divider
                v-if="index < growthDataList.length - 1"
                class="mt-4"
              ></v-divider>
            </div>
          </div>
          <div
            v-else
            class="text-center pa-8 text-grey"
          >
            <v-icon size="48">mdi-information-outline</v-icon>
            <p class="mt-2">该药材目前没有关联的生长数据记录。</p>
          </div>
        </v-card>
    </template>

    <div v-else class="text-center pa-16">
        <v-icon size="64" color="grey-lighten-1">mdi-database-off-outline</v-icon>
        <p class="text-h6 text-grey-darken-1 mt-4">未找到该药材的信息</p>
        <v-btn class="mt-4" @click="goBack" color="primary">返回列表</v-btn>
    </div>

    <v-footer
      app
      class="d-flex justify-end pa-4 bg-grey-lighten-4"
      style="z-index: 1005;"
    >
      <v-btn
        variant="text"
        @click="goBack"
        class="mr-4"
      >返回列表</v-btn>
      <v-btn
        color="teal"
        variant="flat"
        @click="saveAllGrowthData"
        :loading="isSavingGrowthData"
        class="mr-4"
        v-if="growthDataList.length > 0"
      >
        保存所有生长信息
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        @click="saveHerbChanges"
        :loading="isSavingHerb"
        :disabled="!isFormValid"
      >
        保存基本信息
      </v-btn>
    </v-footer>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/api/http";
import type { Herb, HerbGrowthDataDto } from "@/api/herbApi";
import { useSnackbarStore } from "@/stores/snackbarStore";

const route = useRoute();
const router = useRouter();
const snackbarStore = useSnackbarStore();

// --- State ---
const herbData = ref<Herb | null>(null);
const growthDataList = ref<HerbGrowthDataDto[]>([]);
const isLoading = ref(true);
const isSavingHerb = ref(false);
const isSavingGrowthData = ref(false);
const isFormValid = ref(false);
const error = ref<string | null>(null); // 新增错误状态

const rules = {
  required: (value: string) => !!value || "此项为必填项。",
};

// --- Data Fetching ---
onMounted(async () => {
  const herbId = route.params.id as string;
  if (!herbId) {
    snackbarStore.showErrorMessage("无效的药材ID");
    router.push("/");
    return;
  }

  isLoading.value = true;
  try {
    const [herbResponse, growthDataResponse] = await Promise.all([
      http.get<{ data: Herb }>(`/herb/herbs/${herbId}`),
      http.get<{ data: HerbGrowthDataDto[] }>(`/herb/${herbId}/growth-data`),
    ]);

    herbData.value = herbResponse.data.data;
    growthDataList.value = growthDataResponse.data.data;

    // 如果 herbData 为 null 或 undefined，说明后端没找到数据
    if (!herbData.value) {
        throw new Error("服务器未返回有效的药材数据，可能是ID不存在。");
    }

  } catch (err: any) {
    console.error("加载药材全部信息失败:", err);
    const errorMessage = err.response?.data?.msg || err.message || "加载药材数据失败，请检查网络或ID是否正确。";
    snackbarStore.showErrorMessage(errorMessage);
    error.value = errorMessage; // 记录错误信息
  } finally {
    isLoading.value = false;
  }
});

// --- Save Functions ---
// 保存药材基本信息
const saveHerbChanges = async () => {
  if (!isFormValid.value || !herbData.value) return;

  isSavingHerb.value = true;
  try {
    await http.put(`/herb/herbs/${herbData.value.id}`, herbData.value);
    snackbarStore.showSuccessMessage("药材基本信息更新成功！");
  } catch (error) {
    console.error("更新药材基本信息失败:", error);
    snackbarStore.showErrorMessage("更新失败，请稍后重试");
  } finally {
    isSavingHerb.value = false;
  }
};

// 【新增】保存所有生长信息
const saveAllGrowthData = async () => {
  if (growthDataList.value.length === 0) return;

  isSavingGrowthData.value = true;
  try {
    // 创建一个包含所有更新请求的Promise数组
    const updatePromises = growthDataList.value.map((item) =>
      http.put(`/herb/growth-data/${item.growthDataId}`, item)
    );

    // 并发执行所有更新请求
    await Promise.all(updatePromises);

    snackbarStore.showSuccessMessage("所有生长信息均已成功保存！");
  } catch (error) {
    console.error("批量更新生长数据失败:", error);
    snackbarStore.showErrorMessage(
      "部分或全部生长信息保存失败，请检查数据后重试"
    );
  } finally {
    isSavingGrowthData.value = false;
  }
};

// --- Navigation ---
const goBack = () => {
  router.back();
};
</script>