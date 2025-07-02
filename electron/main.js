// electron/main.js

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// 1. 【推荐】使用 app.isPackaged 来准确判断环境
const isDev = !app.isPackaged;

let mainWindow;
let backendProcess = null;

// 启动后端服务 (此函数逻辑是正确的，无需修改)
function runBackend() {
  const backendJarPath = isDev
    ? path.join(__dirname, '..', 'backend', 'BiomedInfoSystem-0.0.1-SNAPSHOT.jar')
    : path.join(process.resourcesPath, 'backend.jar');

  const jreExecutable = process.platform === 'win32' ? 'java.exe' : 'java';
  const jrePath = isDev
    ? path.join(__dirname, '..', 'jre', 'bin', jreExecutable)
    : path.join(process.resourcesPath, 'jre', 'bin', jreExecutable);

  console.log(`[Backend] JRE Path: ${jrePath}`);
  console.log(`[Backend] JAR Path: ${backendJarPath}`);

  try {
    backendProcess = spawn(jrePath, ['-jar', backendJarPath]);

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] >> ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend ERR] >> ${data}`);
      if (!isDev) {
        dialog.showErrorBox('后端服务错误', data.toString());
      }
    });

    backendProcess.on('close', (code) => {
      console.log(`[Backend] 后端服务已退出，退出码 ${code}`);
    });

    backendProcess.on('error', (err) => {
       console.error('[Backend] 无法启动后端进程:', err);
       if(!isDev) {
          dialog.showErrorBox('后端启动失败', `无法启动Java进程，请检查JRE配置。\n错误: ${err.message}`);
       }
    });
  } catch (err) {
      console.error('[Backend] Spawn process failed:', err);
      if(!isDev) {
        dialog.showErrorBox('后端启动异常', `创建子进程失败。\n错误: ${err.message}`);
      }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // 2. 【推荐】为开发和生产环境使用不同的加载方式
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器，享受热更新
    // 确认你的 vite dev server 运行在 5173 端口
    mainWindow.loadURL('http://localhost:5173'); 
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的静态文件
    const indexPath = path.join(__dirname, 'dist/index.html');
    mainWindow.loadFile(indexPath);
  }
}

// 当 Electron 完成初始化后...
app.whenReady().then(() => {
  // 3. 【核心修正】在这里调用 runBackend() 来启动后端服务！
  runBackend(); 
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 在应用退出前，确保杀死后端子进程
app.on('before-quit', () => {
  if (backendProcess) {
    console.log('正在关闭后端服务...');
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

