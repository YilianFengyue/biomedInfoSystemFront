// electron/main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process'); // 1. 引入 child_process 模块
const net = require('net'); // <--- 把这一行加进去！

// 判断是否处于开发环境
const isDev = process.env.NODE_ENV !== 'production';

let backendProcess = null; // 用于存储后端进程的引用

// 新增一个函数，用于检测端口是否被占用
function checkPortInUse(port, callback) {
  const server = net.createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      callback(true); // 端口已被占用
    }
  });
  server.once('listening', () => {
    server.close();
    callback(false); // 端口未被占用
  });
  server.listen(port);
}

function startBackend(onBackendReady) {
  const isDev = process.env.NODE_ENV !== 'production';
  const backendPath = isDev 
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'backend');
  
  const jarFile = path.join(backendPath, 'BiomedInfoSystem-0.0.1-SNAPSHOT.jar');
  const javaExecutable = process.platform === 'win32'
    ? path.join(backendPath, 'jre', 'bin', 'java.exe')
    : path.join(backendPath, 'jre', 'bin', 'java');

  console.log(`Starting backend: ${javaExecutable} -jar ${jarFile}`);
  backendProcess = spawn(javaExecutable, ['-jar', jarFile], {
    cwd: backendPath // 设置工作目录
  });

  // 监听后端的输出
  backendProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Backend stdout: ${output}`);
    // 通过日志判断 Spring Boot 是否已启动成功
    if (output.includes("Tomcat started on port(s): 81")) {
      console.log('Backend is ready!');
      if (onBackendReady) {
        onBackendReady();
      }
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 预加载脚本，推荐使用，用于在渲染进程中安全地暴露 Node.js API
      // 注意：需要您创建一个 preload.js 文件
      preload: path.join(__dirname, 'preload.js'),
      // 出于安全考虑，推荐将 contextIsolation 保持为 true
      contextIsolation: true,
      // 在开发模式下可以启用 nodeIntegration，但发布时建议关闭
      nodeIntegration: false,
    }
  });

  // 根据环境加载不同的 URL
  if (isDev) {
    // 生产环境下，加载打包后的 index.html 文件
    // 关键！这里的路径必须和您用 asar list 看到的路径匹配
    // __dirname 指向 /electron 目录，所以我们需要再拼接上 'dist/index.html'
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
    // 自动打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境下，加载打包后的 index.html 文件
    // 根据您之前的日志，Vite 将文件打包到了 electron/dist/ 目录下
    // __dirname 指向当前文件所在的目录 (即 electron/)
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// 当 Electron 完成初始化后，创建窗口
// 修改 whenReady 逻辑
app.whenReady().then(() => {
  // 先启动后端，并传递一个回调函数
  startBackend(() => {
    // 当后端准备好后，再创建窗口
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


// 除了 macOS 外，当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill(); // 5. 关闭后端进程
    }
    app.quit();
  }
});

// 在应用退出前，再次确保后端进程被关闭
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
