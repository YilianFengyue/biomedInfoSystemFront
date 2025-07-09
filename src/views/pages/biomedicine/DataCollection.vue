<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { getAddressFromCoordinates, geocodeAddress } from '@/utils/amap';
import {
  searchHerbsApi,
  getOSSPolicyApi,
  createHerbApi,
  type Herb,
  type LocationCreatePayload,
  type ImageInfo,
  type HerbCreatePayload,
} from '@/api/herbApi';
import { debounce } from 'lodash-es';
import provinces from '@/data/provinces.json';
import http from '@/api/http';
import { useProfileStore } from '@/stores/profileStore';
import axios from 'axios';

// --- State ---
const snackbarStore = useSnackbarStore();
const profileStore = useProfileStore();
const formStep1 = ref<any>(null);
const formStep2 = ref<any>(null);
const isStep1Valid = ref(false);
const isStep2Valid = ref(false);
const isSubmitting = ref(false);
const isGettingLocation = ref(false);
const isSearchingHerbs = ref(false);
const isCreatingNewHerb = ref(false);
const step = ref(1);
const manualLocationEntry = ref(false);
const selectedHerb = ref<Herb | null>(null);
const searchedHerbs = ref<Herb[]>([]);
const uploadProgress = ref(0);

const locationData = ref({
  longitude: null as number | null,
  latitude: null as number | null,
  province: '',
  city: '',
  address: '',
});

const selectedFiles = ref<File[]>([]);
const primaryImageIndex = ref<number>(0);
const imagePreviewUrls = ref<string[]>([]);

const newHerb = ref<HerbCreatePayload>({
    name: '',
    scientificName: '',
    familyName: '',
    resourceType: '野生',
    lifeForm: '',
    description: ''
});

const growthData = ref({
    metricName: '平均株高',
    metricValue: '',
    metricUnit: 'cm',
    recordedAt: new Date().toISOString().slice(0, 16)
});

const metricNameOptions = ['平均株高', '产量', '叶片面积', '根茎长度', '土壤PH值'];
const metricUnitOptions = ref(['cm', 'kg', 'm²', 'g/株']);

watch(() => growthData.value.metricName, (newName) => {
    if (newName === '平均株高' || newName === '根茎长度') metricUnitOptions.value = ['cm', 'm'];
    else if (newName === '产量') metricUnitOptions.value = ['kg', 'g/株', '吨/亩'];
    else if (newName === '叶片面积') metricUnitOptions.value = ['cm²', 'm²'];
    else if (newName === '土壤PH值') metricUnitOptions.value = ['无'];
    else metricUnitOptions.value = [];
    growthData.value.metricUnit = metricUnitOptions.value[0] || '';
});

const cities = computed(() => {
    if (locationData.value.province) {
        const province = provinces.find(p => p.name === locationData.value.province);
        return province ? province.children.map(c => c.name) : [];
    }
    return [];
});

watch(() => locationData.value.province, () => {
  locationData.value.city = '';
});

watch(selectedFiles, (newFiles) => {
  imagePreviewUrls.value.forEach(url => URL.revokeObjectURL(url));
  
  if (newFiles && newFiles.length > 0) {
    imagePreviewUrls.value = newFiles.map(file => URL.createObjectURL(file));
  } else {
    imagePreviewUrls.value = [];
  }
}, { deep: true });

// --- 新增：移除图片的方法 ---
const removeImage = (indexToRemove: number) => {
    // 从 selectedFiles 数组中移除文件
    selectedFiles.value = selectedFiles.value.filter((_, index) => index !== indexToRemove);

    // 移除文件后，需要调整主图索引
    if (primaryImageIndex.value === indexToRemove) {
        primaryImageIndex.value = 0; // 如果主图被移除，重置为第一个
    } else if (primaryImageIndex.value > indexToRemove) {
        primaryImageIndex.value--; // 如果移除的是主图前面的图片，索引减一
    }
    // selectedFiles 的侦听器会自动更新预览 URL
};

const rules = {
  required: (v: any) => !!v || '此字段为必填项',
  requiredObject: (v: any) => !!(v && v.id) || '必须选择一个药材',
  requiredLocation: (v: any) => {
      if (manualLocationEntry.value) {
          return !!locationData.value.province && !!locationData.value.address || '手动模式下，省份和详细地址为必填项';
      }
      return !!locationData.value.longitude || '自动模式下，必须采集地理位置';
  }
};

const locationDisplay = computed(() => {
  if(manualLocationEntry.value) {
    return '手动输入模式'
  }
  const { longitude, latitude } = locationData.value;
  return latitude ? `经纬度: ${longitude?.toFixed(6)}, ${latitude?.toFixed(6)}` : '尚未获取地理位置';
});

const uploadFileWithProgress = async (file: File, onProgress: (percent: number) => void): Promise<string> => {
  if (!file) return '';

  const policyResponse = await getOSSPolicyApi();
  const policyData = policyResponse.data.data;

  const formData = new FormData();
  const objectKey = `${policyData.dir}${Date.now()}_${file.name}`;
  formData.append('key', objectKey);
  formData.append('policy', policyData.policy);
  formData.append('OSSAccessKeyId', policyData.accessid);
  formData.append('success_action_status', '200');
  formData.append('signature', policyData.signature);
  formData.append('file', file);

  try {
    const response = await axios.post(policyData.host, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    if (response.status === 200) {
      snackbarStore.showSuccessMessage(`文件 ${file.name} 上传成功!`);
      return `${policyData.host}/${objectKey}`;
    }
    throw new Error('文件上传到OSS时状态码非200');
  } catch (error: any) {
    console.error("文件上传到OSS时出错:", error);
    const errorMessage = error.response?.data?.message || error.message || `文件 ${file.name} 上传失败`;
    snackbarStore.showErrorMessage(errorMessage);
    return '';
  }
};

const handleStepperAction = async (nextFn: () => void) => {
    if (step.value === 1) {
        const { valid } = await formStep1.value.validate();
        if (valid) nextFn();
        else snackbarStore.showWarningMessage('请先完成当前步骤的信息');
    } else if (step.value === 2) {
        const { valid } = await formStep2.value.validate();
        if (valid) nextFn();
        else snackbarStore.showWarningMessage('请先完成当前步骤的信息');
    } else if (step.value === 3) {
        submit();
    }
}

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
        const addressInfo = await getAddressFromCoordinates(longitude, latitude);

        locationData.value = {
            longitude,
            latitude,
            ...addressInfo
        };
        snackbarStore.showSuccessMessage('地理位置解析成功！');
    } catch (error: any) {
        snackbarStore.showErrorMessage(`操作失败: ${error.message}`);
    } finally {
        isGettingLocation.value = false;
    }
};

const resetForm = () => {
    formStep1.value?.resetValidation();
    formStep2.value?.resetValidation();
    step.value = 1;
    manualLocationEntry.value = false;
    isCreatingNewHerb.value = false;
    selectedHerb.value = null;
    newHerb.value = { name: '', scientificName: '', familyName: '', resourceType: '野生', lifeForm: '', description: '' };
    locationData.value = { longitude: null, latitude: null, province: '', city: '', address: '' };
    selectedFiles.value = [];
    primaryImageIndex.value = 0;
    growthData.value = { metricName: '平均株高', metricValue: '', metricUnit: 'cm', recordedAt: new Date().toISOString().slice(0, 16) };
};

const submit = async () => {
  isSubmitting.value = true;
  uploadProgress.value = 0; 

  try {
    let herbIdToUse: number;

    if (manualLocationEntry.value) {
        snackbarStore.showInfoMessage('正在解析手动输入的地址...');
        try {
            const fullAddress = `${locationData.value.province}${locationData.value.city}${locationData.value.address}`;
            const location = await geocodeAddress(fullAddress);
            locationData.value.longitude = location.lng;
            locationData.value.latitude = location.lat;
        } catch (error) {
            throw new Error('手动地址解析失败，请检查地址是否正确或过于模糊。');
        }
    }

    if (isCreatingNewHerb.value) {
        const herbResponse = await createHerbApi(newHerb.value);
        herbIdToUse = herbResponse.data.data.id;
        snackbarStore.showSuccessMessage(`新药材 "${newHerb.value.name}" 创建成功 (ID: ${herbIdToUse})`);
    } else {
        herbIdToUse = selectedHerb.value!.id;
    }

    const locationPayload: LocationCreatePayload = {
      herbId: herbIdToUse,
      longitude: locationData.value.longitude,
      latitude: locationData.value.latitude,
      province: locationData.value.province,
      city: locationData.value.city,
      address: locationData.value.address,
      observationYear: new Date().getFullYear(),
      description: `对 ${isCreatingNewHerb.value ? newHerb.value.name : selectedHerb.value!.name} 的一次新观测`,
    };

    const formattedRecordedAt = new Date(growthData.value.recordedAt + ':00').toISOString().slice(0, 19);

    const uploadDto = {
        ...locationPayload,
        growthData: {
            metricName: growthData.value.metricName,
            metricValue: growthData.value.metricValue,
            metricUnit: growthData.value.metricUnit,
            recordedAt: formattedRecordedAt
        },
        uploaderName: profileStore.user?.username || '未知上传者'
    };

    const locationResponse = await http.post('/herb/locations', uploadDto);
    const newLocationId = locationResponse.data.data.id;
    snackbarStore.showSuccessMessage(`观测点创建成功 (ID: ${newLocationId})`);

    if (selectedFiles.value.length > 0) {
      const imageUrls = [];
      for (const file of selectedFiles.value) {
          const url = await uploadFileWithProgress(file, (percent) => {
              uploadProgress.value = percent;
          });
          if (url) {
              imageUrls.push(url);
          } else {
              throw new Error(`文件 ${file.name} 上传失败，操作已中断。`);
          }
      }

      const imagesToLink: ImageInfo[] = imageUrls.map((url, index) => ({
        url: url,
        primary: isCreatingNewHerb.value ? (index === primaryImageIndex.value) : false,
        description: `${(isCreatingNewHerb.value && index === primaryImageIndex.value) ? '主图' : '附加图片'}: ${selectedFiles.value[index].name}`
      }));

      await http.post(`/herb/locations/${newLocationId}/images`, { images: imagesToLink });
      snackbarStore.showSuccessMessage(`${imagesToLink.length} 张图片已成功关联`);
    }

    snackbarStore.showSuccessMessage('所有数据已成功保存！');
    resetForm();

  } catch (error: any) {
    const errorMessage = error.response?.data?.msg || error.message || '未知操作失败';
    snackbarStore.showErrorMessage(errorMessage);
  } finally {
    isSubmitting.value = false;
    uploadProgress.value = 0; 
  }
};
</script>

<template>
  <v-container fluid class="pa-md-6 pa-4">
    <v-card class="main-card" rounded="lg">
      <v-card-title class="pa-5">
        <h2 class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-3" size="large">mdi-database-plus-outline</v-icon>
          创建新的药材观测记录
        </h2>
      </v-card-title>
      <v-divider></v-divider>

      <v-progress-linear
        v-if="isSubmitting"
        v-model="uploadProgress"
        :color="uploadProgress < 100 ? 'yellow-darken-2' : 'green'"
        height="25"
        stream
        striped
      >
        <strong class="white-text">{{ Math.ceil(uploadProgress) }}%</strong>
      </v-progress-linear>

      <v-stepper v-model="step" :items="['选择药材', '观测详情', '确认提交']" alt-labels editable>
        <template v-slot:item.1>
          <v-card title="第一步：选择或创建药材" flat>
            <v-card-text>
              <v-form ref="formStep1" v-model="isStep1Valid">
                <v-switch
                  v-model="isCreatingNewHerb"
                  :label="isCreatingNewHerb ? '模式：正在创建新药材' : '模式：为已有药材添加观测'"
                  color="primary"
                  inset
                  class="mb-5"
                ></v-switch>

                <div v-if="!isCreatingNewHerb">
                  <v-autocomplete
                    v-model="selectedHerb"
                    :items="searchedHerbs"
                    :loading="isSearchingHerbs"
                    @update:search="onHerbSearchInput"
                    item-title="name"
                    item-value="id"
                    return-object
                    label="搜索一个药材"
                    placeholder="输入药材名称进行搜索..."
                    variant="outlined"
                    class="mb-4"
                    :rules="isCreatingNewHerb ? [] : [rules.requiredObject]"
                    prepend-inner-icon="mdi-magnify"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :subtitle="item.raw.scientificName || '无学名'"></v-list-item>
                    </template>
                    <template v-slot:no-data>
                      <v-list-item>
                        <v-list-item-title>无匹配结果。请输入关键字进行搜索，或切换到“创建新药材”模式。</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </div>

                <div v-else>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="newHerb.name"
                        label="新药材名称"
                        variant="outlined"
                        :rules="isCreatingNewHerb ? [rules.required] : []"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="newHerb.scientificName" label="学名" variant="outlined"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="newHerb.familyName" label="科名" variant="outlined"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="newHerb.resourceType"
                        :items="['野生', '栽培']"
                        label="资源类型"
                        variant="outlined"
                        :rules="isCreatingNewHerb ? [rules.required] : []"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="newHerb.lifeForm" label="生活型" variant="outlined"></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea v-model="newHerb.description" label="简介/药用价值描述" variant="outlined" rows="3"></v-textarea>
                    </v-col>
                  </v-row>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </template>

        <template v-slot:item.2>
          <v-card title="第二步：添加观测详情" flat>
            <v-card-text>
               <v-form ref="formStep2" v-model="isStep2Valid">
                <v-card-subtitle class="text-h6 pa-0 mb-3">地理位置信息</v-card-subtitle>
                <v-switch
                    v-model="manualLocationEntry"
                    :label="manualLocationEntry ? '模式：手动输入地址' : '模式：自动GPS定位'"
                    color="teal"
                    inset
                    class="mb-4"
                ></v-switch>
                <v-text-field
                  v-if="!manualLocationEntry"
                  v-model="locationDisplay"
                  label="采集观测点地理位置"
                  prepend-inner-icon="mdi-map-marker-outline"
                  readonly variant="outlined" class="mb-6"
                  :hint="locationData.address || '点击右侧按钮自动获取当前位置'"
                  persistent-hint :rules="[rules.requiredLocation]"
                >
                  <template v-slot:append-inner>
                    <v-btn icon @click="getGeoLocation" :loading="isGettingLocation" variant="text">
                      <v-icon>mdi-crosshairs-gps</v-icon>
                      <v-tooltip activator="parent" location="top">自动获取</v-tooltip>
                    </v-btn>
                  </template>
                </v-text-field>
                <v-row v-else>
                    <v-col cols="12" sm="6"><v-select v-model="locationData.province" :items="provinces.map(p => p.name)" label="省份/直辖市" variant="outlined" :rules="[rules.required]"></v-select></v-col>
                    <v-col cols="12" sm="6"><v-select v-model="locationData.city" :items="cities" label="城市" variant="outlined" no-data-text="请先选择省份" :disabled="!locationData.province"></v-select></v-col>
                    <v-col cols="12"><v-text-field v-model="locationData.address" label="详细地址" variant="outlined" placeholder="例如：XX街道XX号" :rules="[rules.required]"></v-text-field></v-col>
                </v-row>
                
                <v-divider class="my-6"></v-divider>
                <v-card-subtitle class="text-h6 pa-0 mb-3">生长数据</v-card-subtitle>
                <v-row>
                    <v-col cols="12" md="4">
                        <v-select
                            v-model="growthData.metricName"
                            :items="metricNameOptions"
                            label="指标名称"
                            variant="outlined"
                            :rules="[rules.required]"
                        ></v-select>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-text-field
                            v-model="growthData.metricValue"
                            label="指标值"
                            variant="outlined"
                            :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-combobox
                            v-model="growthData.metricUnit"
                            :items="metricUnitOptions"
                            label="指标单位 (可自定义)"
                            variant="outlined"
                        ></v-combobox>
                    </v-col>
                    <v-col cols="12">
                        <v-text-field
                          v-model="growthData.recordedAt"
                          label="记录时间"
                          type="datetime-local"
                          variant="outlined"
                          :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>
                </v-row>

                <v-divider class="my-6"></v-divider>
                <v-card-subtitle class="text-h6 pa-0 mb-3">观测图片</v-card-subtitle>
                <v-file-input
                  v-model="selectedFiles"
                  label="上传观测照片 (可多选)"
                  multiple accept="image/*" prepend-icon=""
                  prepend-inner-icon="mdi-camera" variant="outlined"
                  chips show-size counter class="mt-4"
                ></v-file-input>
                
                <div v-if="imagePreviewUrls.length > 0" class="mt-4 pa-3 rounded-lg preview-area">
                    <p class="text-subtitle-1 font-weight-medium mb-3">图片预览 ({{ imagePreviewUrls.length }} 张)</p>
                    <v-row dense>
                        <v-col
                            v-for="(url, index) in imagePreviewUrls"
                            :key="index"
                            cols="6" sm="4" md="3"
                            class="pa-1"
                        >
                            <v-card class="image-preview-container" elevation="0" rounded="md" border>
                                <v-img :src="url" aspect-ratio="1" cover class="rounded-md"></v-img>
                                <v-btn
                                    icon="mdi-close-circle"
                                    size="small"
                                    variant="text"
                                    class="remove-image-btn"
                                    @click.stop="removeImage(index)"
                                    title="移除图片"
                                >
                                </v-btn>
                            </v-card>
                        </v-col>
                    </v-row>
                </div>


                <v-card v-if="isCreatingNewHerb && selectedFiles.length > 0" variant="tonal" class="mt-4 pa-3">
                    <p class="text-subtitle-1 font-weight-medium mb-3">请为新药材选择一张主图：</p>
                    <v-radio-group v-model="primaryImageIndex" inline>
                        <v-row dense>
                            <v-col v-for="(file, index) in selectedFiles" :key="index" cols="6" sm="4" md="3" class="pa-1">
                                <v-card
                                    class="image-preview-card"
                                    :class="{ 'border-primary': primaryImageIndex === index }"
                                    @click="primaryImageIndex = index"
                                    rounded="md"
                                >
                                    <v-img :src="imagePreviewUrls[index]" aspect-ratio="1" cover>
                                        <v-radio :value="index" class="radio-on-image"></v-radio>
                                    </v-img>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-radio-group>
                </v-card>
               </v-form>
            </v-card-text>
          </v-card>
        </template>

        <template v-slot:item.3>
          <v-card title="第三步：确认并提交" flat>
             <v-card-text>
                <v-list lines="two" class="review-list">
                    <v-list-item>
                        <template v-slot:prepend><v-icon color="primary">mdi-leaf</v-icon></template>
                        <v-list-item-title>药材信息</v-list-item-title>
                        <v-list-item-subtitle v-if="isCreatingNewHerb">
                            即将创建新药材: <strong>{{ newHerb.name || '未命名' }}</strong>
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-else>
                            为已有药材添加观测: <strong>{{ selectedHerb?.name || '未选择' }}</strong>
                        </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider inset></v-divider>

                    <v-list-item>
                        <template v-slot:prepend><v-icon color="teal">mdi-map-marker</v-icon></template>
                        <v-list-item-title>观测地点</v-list-item-title>
                        <v-list-item-subtitle>
                            <span v-if="manualLocationEntry">{{ locationData.province }} {{ locationData.city }} {{ locationData.address }}</span>
                            <span v-else>{{ locationData.address || '未获取位置' }}</span>
                        </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider inset></v-divider>
                    <v-list-item>
                         <template v-slot:prepend><v-icon color="green">mdi-chart-line</v-icon></template>
                         <v-list-item-title>生长数据</v-list-item-title>
                         <v-list-item-subtitle>
                           指标: <strong>{{ growthData.metricName }}</strong>,
                           数值: <strong>{{ growthData.metricValue }} {{ growthData.metricUnit || '' }}</strong>
                         </v-list-item-subtitle>
                    </v-list-item>

                    <v-divider inset></v-divider>

                     <v-list-item>
                        <template v-slot:prepend><v-icon color="orange">mdi-camera-burst</v-icon></template>
                        <v-list-item-title>观测图片</v-list-item-title>
                        <v-list-item-subtitle>
                            共选择了 <strong>{{ selectedFiles.length }}</strong> 张图片。
                             <span v-if="isCreatingNewHerb && selectedFiles.length > 0">
                                (第 {{ primaryImageIndex + 1 }} 张已设为主图)
                             </span>
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
             </v-card-text>
          </v-card>
        </template>

        <template v-slot:actions="{ prev, next }">
          <v-card-actions class="pa-4">
            <v-btn v-if="step > 1" @click="prev" variant="text">
              上一步
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              @click="handleStepperAction(next)"
              color="primary"
              variant="flat"
              :loading="isSubmitting"
            >
              {{ step === 3 ? '确认提交' : '下一步' }}
            </v-btn>
          </v-card-actions>
        </template>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.main-card {
    background-color: #f8f9fa;
}
.image-preview-card {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    border: 2px solid transparent;
    &:hover {
        transform: scale(1.03);
    }
}
.border-primary {
  border-color: #1976D2;
  box-shadow: 0 0 8px rgba(25, 118, 210, 0.4);
}
.radio-on-image {
    position: absolute;
    top: 4px;
    right: 4px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
}
.review-list {
    background-color: #fafafa;
    border-radius: 8px;
}
.white-text {
  color: white !important;
  font-weight: 600;
}

/* --- 新增的预览区样式 --- */
.preview-area {
  background-color: #f5f5f5;
  border: 1px dashed #ddd;
}

.image-preview-container {
  position: relative;
  overflow: hidden; 
  
  &:hover .remove-image-btn {
    opacity: 1;
    transform: scale(1);
  }
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5) !important;
  color: white !important;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: rgba(255, 0, 0, 0.7) !important;
  }
}

.data-collection-container {
  background-color: #f4f6f9;
  padding: 24px;
}

.control-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.collect-btn {
  background-color: #B0D183 !important;
  color: white !important;
  margin-right: 12px;
}

.stop-btn {
  background-color: #BCA881 !important;
  color: white !important;
}

.log-area {
  background-color: #333;
  color: #C1CBAD;
  border-radius: 8px;
}
</style>