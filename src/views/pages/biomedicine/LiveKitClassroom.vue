<template>
  <div class="livekit-classroom-wrapper">
    <v-container v-if="!isConnected" class="fill-height justify-center align-center">
      <v-card class="connection-card" elevation="12" width="450">
        <v-card-title class="text-h5 font-weight-bold text-center pa-4">
          <v-icon color="primary" class="mr-2">mdi-dna</v-icon>
          生物医药直播课堂
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-6">
          <v-form>
            <v-text-field
              v-model="roomName"
              label="课堂房间名"
              prepend-inner-icon="mdi-hospital-building"
              variant="outlined"
              placeholder="例如: cell-biology-01"
            ></v-text-field>
            <v-text-field
              v-model="userIdentity"
              label="你的身份标识"
              prepend-inner-icon="mdi-account-key"
              variant="outlined"
              placeholder="老师请输入 teacher-xxx"
            ></v-text-field>
            <v-text-field
              v-model="userName"
              label="你的显示名称"
              prepend-inner-icon="mdi-account-circle"
              variant="outlined"
              placeholder="例如: 张老师"
            ></v-text-field>
          </v-form>
          <p class="text-caption text-grey-darken-1 mt-2">
            提示：老师的身份标识请以 `teacher-` 开头，否则将没有推流权限。
          </p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn
            :loading="isLoading"
            :disabled="isLoading"
            @click="connectToRoom"
            color="primary"
            size="large"
            block
            variant="elevated"
          >
            {{ isLoading ? '正在进入...' : '进入课堂' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <div v-else class="classroom-layout">
      <div class="video-main-area">
        <div class="header d-flex align-center pa-3">
          <h2 class="text-h6">课堂: {{ roomName }}</h2>
          <v-chip color="red" text-color="white" small class="ml-4 font-weight-bold">
            <v-icon left size="small">mdi-access-point</v-icon>
            LIVE
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn @click="disconnect" class="disconnect-btn" color="red" variant="tonal">
            <v-icon left>mdi-logout</v-icon>
            离开课堂
          </v-btn>
        </div>
        <div class="teacher-view">
          <div class="video-wrapper">
            <video ref="teacherVideoRef" class="video-placeholder"></video>
            <div v-if="!teacherTrack" class="overlay-text">等待主讲人开启视频...</div>
          </div>
        </div>
      </div>

      <div v-if="isTeacher" class="sidebar">
        <v-card class="local-view-card" elevation="2">
          <v-card-title>我的画面 (预览)</v-card-title>
          <v-card-text>
            <div class="local-video-wrapper">
              <video ref="localVideoRef" class="video-placeholder" muted autoplay playsinline></video>
            </div>
            <div class="controls mt-4">
              <v-btn @click="toggleVideo" :color="isVideoEnabled ? 'primary' : 'grey'" block>
                <v-icon left>{{ isVideoEnabled ? 'mdi-camera-off' : 'mdi-camera' }}</v-icon>
                {{ isVideoEnabled ? '关闭摄像头' : '开启摄像头' }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { Room, RoomEvent, createLocalVideoTrack } from 'livekit-client';

const tokenEndpoint = '/api/live/token';
const livekitHost = 'wss://medic-app-iivkx6lq.livekit.cloud';

const roomName = ref('biomed-class-01');
const userIdentity = ref('teacher-101');
const userName = ref('张老师');
const isConnected = ref(false);
const isLoading = ref(false);
const teacherTrack = ref(null);
const isVideoEnabled = ref(false);

const teacherVideoRef = ref(null);
const localVideoRef = ref(null);

let room = null;
let localVideoTrack = null;

const isTeacher = computed(() => userIdentity.value.startsWith('teacher'));

const connectToRoom = async () => {
  if (!roomName.value || !userIdentity.value || !userName.value) {
    alert('所有输入项都不能为空！');
    return;
  }
  isLoading.value = true;
  
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: roomName.value,
        identity: userIdentity.value,
        name: userName.value,
      }),
    });
    if (!response.ok) throw new Error(`获取Token失败: ${response.statusText}`);
    const data = await response.json();
    const token = data.accessToken;

    room = new Room({ adaptiveStream: true, dynacast: true });
    setupRoomListeners();

    await room.connect(livekitHost, token);
    isConnected.value = true;

    if (isTeacher.value) {
      await publishOwnVideo();
    }
  } catch (error) {
    console.error('连接直播间失败:', error);
    alert(`连接失败: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const publishOwnVideo = async () => {
  try {
    localVideoTrack = await createLocalVideoTrack({
      resolution: { width: 1280, height: 720, frameRate: 30 },
    });
    
    // 附加到右侧的本地预览窗口
    if (localVideoRef.value) {
      localVideoTrack.attach(localVideoRef.value);
    }
    
    // 发布轨道到LiveKit服务器
    await room.localParticipant.publishTrack(localVideoTrack);
    isVideoEnabled.value = true;
    console.log('本地视频轨道已发布');

    teacherTrack.value = localVideoTrack; 
    if (teacherVideoRef.value) {
      localVideoTrack.attach(teacherVideoRef.value); 
    }

  } catch (error) {
    console.error('发布视频失败:', error);
    alert('无法开启摄像头，请检查设备权限。');
  }
};

const setupRoomListeners = () => {
  room
    .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === 'video' && participant.identity.startsWith('teacher')) {
        teacherTrack.value = track;
        if (teacherVideoRef.value) {
          track.attach(teacherVideoRef.value);
        }
      }
    })
    .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      track.detach();
      if (participant.identity.startsWith('teacher')) {
        teacherTrack.value = null;
      }
    })
    .on(RoomEvent.Disconnected, handleDisconnect);
};

const disconnect = () => room?.disconnect();

const toggleVideo = async () => {
  if (localVideoTrack) {
    const enabled = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    isVideoEnabled.value = enabled;
  }
};

const handleDisconnect = () => {
  isConnected.value = false;
  teacherTrack.value = null;
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.detach();
    localVideoTrack = null;
  }
  room = null;
};

onBeforeUnmount(() => disconnect());
</script>

<style scoped>
.livekit-classroom-wrapper {
  height: 100vh;
  width: 100%;
  background-color: #f4f5f7;
  display: flex;
}

.connection-card {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.8);
}

.classroom-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.video-main-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #000;
}

.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

.teacher-view {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #000;
}

.local-video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #2c2c2c;
  border-radius: 8px;
  overflow: hidden;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.5rem;
}

.sidebar {
  width: 300px;
  padding: 16px;
  background-color: #ffffff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.local-view-card {
  width: 100%;
}
</style>