<template>
  <v-container>
    <v-card class="pa-2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-database-plus-outline</v-icon>
        创建新的药材观测记录
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-form ref="form" v-model="isFormValid" lazy-validation>
          <!-- 步骤一：选择药材 -->
          <v-autocomplete
            v-model="selectedHerb"
            :items="searchedHerbs"
            :loading="isSearchingHerbs"
            @update:search="onHerbSearchInput"
            item-title="name"
            item-value="id"
            return-object
            label="1. 选择或搜索一个药材"
            placeholder="输入药材名称进行搜索..."
            variant="outlined"
            class="mb-4"
            :rules="[rules.requiredObject]"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.scientificName || '无学名'"></v-list-item>
            </template>
             <template v-slot:no-data>
              <v-list-item>
                <v-list-item-title>
                  无匹配结果。请输入关键字进行搜索。
                </v-list-item-title>
              </v-list-item>
            </template>
          </v-autocomplete>

          <!-- 步骤二：采集地理位置 -->
          <v-text-field
            v-model="locationDisplay"
            label="2. 采集观测点地理位置"
            prepend-inner-icon="mdi-map-marker"
            readonly
            variant="outlined"
            class="mb-4"
            :hint="locationData.address || '点击右侧按钮自动获取'"
            persistent-hint
            :rules="[rules.requiredLocation]"
          >
            <template v-slot:append-inner>
              <v-btn icon @click="getGeoLocation" :loading="isGettingLocation" variant="text" size="small">
                <v-icon>mdi-crosshairs-gps</v-icon>
                <v-tooltip activator="parent" location="top">自动获取当前位置</v-tooltip>
              </v-btn>
            </template>
          </v-text-field>

          <!-- 步骤三：上传图片 -->
          <v-file-input
            v-model="selectedFiles"
            label="3. 上传观测照片 (可多选)"
            multiple
            accept="image/*"
            prepend-icon="mdi-camera"
            variant="outlined"
            chips
            show-size
            counter
          ></v-file-input>

          <!-- 图片预览和主图选择 -->
          <v-list v-if="selectedFiles.length > 0" class="mt-4" lines="two" rounded="lg">
            <v-list-subheader>设置主图</v-list-subheader>
            <v-radio-group v-model="primaryImageIndex" inline class="w-100">
              <v-list-item
                v-for="(file, index) in selectedFiles"
                :key="file.name + index"
                :value="index"
                class="mb-2 pa-3"
                variant="outlined"
                :class="{ 'border-primary': primaryImageIndex === index }"
                rounded="lg"
              >
                <template v-slot:prepend>
                  <v-avatar rounded="lg" size="64" class="mr-4 elevation-2">
                    <v-img :src="URL.createObjectURL(file)" cover></v-img>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{ file.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-radio :value="index" label="主图"></v-radio>
                </template>
              </v-list-item>
            </v-radio-group>
          </v-list>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          :loading="isSubmitting"
          :disabled="!isFormValid"
          color="success"
          @click="submit"
          size="large"
          variant="flat"
        >
          <v-icon left>mdi-cloud-upload-outline</v-icon>
          提交观测记录
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { getAddressFromCoordinates } from '@/utils/amap';
import {
  searchHerbsApi,
  createLocationApi,
  uploadImagesForLocationApi,
  getOSSPolicyApi,
  uploadFileToOSS,
  type Herb,
  type LocationCreatePayload,
  type ImageInfo,
} from '@/api/herbApi';
import { debounce } from 'lodash-es';

// --- State ---
const snackbarStore = useSnackbarStore();
const form = ref<any>(null);
const isFormValid = ref(false);
const isSubmitting = ref(false);
const isGettingLocation = ref(false);
const isSearchingHerbs = ref(false);

const selectedHerb = ref<Herb | null>(null);
const searchedHerbs = ref<Herb[]>([]);
const locationData = ref({
  longitude: null as number | null,
  latitude: null as number | null,
  province: '',
  city: '',
  address: '',
});
const selectedFiles = ref<File[]>([]);
const primaryImageIndex = ref<number>(0);

// --- Validation Rules ---
const rules = {
  requiredObject: (v: any) => !!(v && v.id) || '必须选择一个药材',
  requiredLocation: (v: any) => !!locationData.value.longitude || '必须采集地理位置',
};

// --- Computed ---
const locationDisplay = computed(() => {
  const { longitude, latitude } = locationData.value;
  return latitude ? `经纬度: ${longitude?.toFixed(6)}, ${latitude?.toFixed(6)}` : '尚未获取地理位置';
});

// --- Methods ---
const onHerbSearchInput = debounce(async (query: string) => {
  if (!query || query.length < 1) {
    searchedHerbs.value = [];
    return;
  }
  isSearchingHerbs.value = true;
  try {
    const response = await searchHerbsApi({ name: query });
    searchedHerbs.value = response.data.data.records;
  } catch (error) {
    snackbarStore.showErrorMessage('搜索药材失败');
  } finally {
    isSearchingHerbs.value = false;
  }
}, 300);

const getGeoLocation = async () => {
    isGettingLocation.value = true;
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
        const { longitude, latitude } = position.coords;
        locationData.value.longitude = longitude;
        locationData.value.latitude = latitude;
        const addressInfo = await getAddressFromCoordinates(longitude, latitude);
        Object.assign(locationData.value, addressInfo);
        snackbarStore.showSuccessMessage('地理位置解析成功！');
    } catch (error: any) {
        snackbarStore.showErrorMessage(`操作失败: ${error.message}`);
    } finally {
        isGettingLocation.value = false;
    }
};

const resetForm = () => { /* ... */ };

const submit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  isSubmitting.value = true;
  try {
    // --- 步骤一：创建观测点 ---
    const locationPayload: LocationCreatePayload = {
      herbId: selectedHerb.value!.id,
      longitude: locationData.value.longitude,
      latitude: locationData.value.latitude,
      province: locationData.value.province,
      city: locationData.value.city,
      address: locationData.value.address,
      observationYear: new Date().getFullYear(),
      description: `对 ${selectedHerb.value!.name} 的一次新观测`,
    };
    
    // 【关键调试步骤】在发送前打印出将要发送的数据
    console.log("即将发送到 /api/herb/locations 的数据 (payload):", JSON.stringify(locationPayload, null, 2));
    
    snackbarStore.showInfoMessage('正在创建观测点记录...');
    const locationResponse = await createLocationApi(locationPayload);
    const newLocationId = locationResponse.data.data.id;
    if (!newLocationId) throw new Error("创建观测点失败");
    snackbarStore.showSuccessMessage(`观测点创建成功 (ID: ${newLocationId})`);

    // --- 步骤二：上传并关联图片 ---
    if (selectedFiles.value.length > 0) {
      const policyResponse = await getOSSPolicyApi();
      const imageUrls = await Promise.all(
        selectedFiles.value.map(file => uploadFileToOSS(file, policyResponse.data.data))
      );
      snackbarStore.showInfoMessage('所有图片已上传至OSS');

      const imagesToLink: ImageInfo[] = imageUrls.map((url, index) => ({
        url: url,
        Primary: index === primaryImageIndex.value,
        description: `${index === primaryImageIndex.value ? '主图' : '附加图片'}: ${selectedFiles.value[index].name}`
      }));

      // vvvv【请在这里添加这行日志】vvvv
      console.log("即将发送到后端的图片数据 (imagesToLink):", JSON.stringify(imagesToLink, null, 2));

      await uploadImagesForLocationApi(newLocationId, { images: imagesToLink });
      snackbarStore.showSuccessMessage(`${imagesToLink.length} 张图片已成功关联`);
    }

    snackbarStore.showSuccessMessage('所有数据已成功保存！');
    resetForm();

  } catch (error: any) {
    const errorMessage = error.response?.data?.msg || error.message || '操作失败';
    snackbarStore.showErrorMessage(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.border-primary {
  border: 2px solid #1976D2;
  background-color: #E3F2FD;
}
</style>