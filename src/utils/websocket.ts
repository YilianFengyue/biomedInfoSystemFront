import { ref, readonly } from 'vue';
import { useProfileStore } from '@/stores/profileStore';

export interface MessagePayload {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  sendTime: string;
  readStatus: number;
}

const isConnected = ref(false);
const messages = ref<MessagePayload[]>([]);
let ws: WebSocket | null = null;
let isConnecting = false; // 【核心】新增一个状态锁，防止在连接过程中重复调用

function connect() {
  const profileStore = useProfileStore();
  const userId = profileStore.user?.id;

  if (!userId) {
    console.warn("[WebSocket] 用户未登录，连接中止。");
    return;
  }
  
  // 【核心】如果正在连接或已经连接，则直接返回
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  isConnecting = true; // 上锁
  const wsUrl = `ws://localhost:81/api/ws?uid=${userId}`;
  console.log(`%c[WebSocket] 正在尝试连接 -> ${wsUrl}`, 'color: blue; font-weight: bold;');
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("%c[WebSocket] 连接成功建立！", 'color: green; font-weight: bold;');
    isConnected.value = true;
    isConnecting = false; // 解锁
  };

  ws.onmessage = (event) => {
    try {
        const newMessages = JSON.parse(event.data);
        const messagesArray = Array.isArray(newMessages) ? newMessages : [newMessages];
        messages.value.unshift(...messagesArray);
    } catch(e) {
        console.error("解析消息失败", e)
    }
  };

  ws.onerror = (error) => {
    console.error("[WebSocket] 发生错误", error);
    isConnected.value = false;
    isConnecting = false; // 解锁
  };

  ws.onclose = () => {
    console.log("[WebSocket] 连接已关闭。");
    isConnected.value = false;
    isConnecting = false; // 解锁
    ws = null;
  };
}

function sendMessage(payload: { from: string, to: string, content: string }) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  } else {
    console.error("[WebSocket] 连接未打开，消息发送失败。");
  }
}

function disconnect() {
    if (ws) {
        ws.onclose = null; 
        ws.close();
        ws = null;
    }
    isConnected.value = false;
    isConnecting = false;
    messages.value = [];
    console.log("[WebSocket] 已主动断开连接。");
}

export function useWebSocket() {
  return {
    isConnected: readonly(isConnected),
    messages: readonly(messages),
    connect,
    disconnect,
    send: sendMessage,
  };
}