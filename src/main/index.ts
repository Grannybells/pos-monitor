import { app, shell, BrowserWindow, ipcMain, Tray, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/solar-system.png?asset'
const si = require('systeminformation')

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

interface CpuInfo {
  manufacturer: string
  brand: string
  speed: number
  cores: number
  physicalCores: number
}

interface MemoryInfo {
  total: number
  free: number
  used: number
}

interface StorageInfo {
  fs: string
  size: number
  used: number
  mount: string
}

interface NetworkInterface {
  iface: string
  ip4: string[]
  ip6: string[]
}

interface SystemData {
  hostname: string
  cpu: CpuInfo
  memory: MemoryInfo
  storage: StorageInfo[]
  network: NetworkInterface[]
}

async function getSystemData(): Promise<SystemData | undefined> {
  try {
    const system = await si.system()
    const cpu = await si.cpu()
    const memory = await si.mem()
    const storage = await si.fsSize()
    const network = await si.networkInterfaces()

    return {
      hostname: system.hostname,
      cpu,
      memory,
      storage,
      network
    }
  } catch (error) {
    console.error('Error getting system data:', error)
    return undefined // Handle the error case
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false, // Do not show the window on creation
    autoHideMenuBar: true,
    icon: icon, // Set the window icon
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    frame: true // Ensure the title bar is visible
  })

  mainWindow.on('ready-to-show', () => {
    // Ensure window is hidden initially
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle minimize event to hide the window but keep it running
  mainWindow.on('minimize', () => {
    mainWindow?.hide() // Hide the window when minimized
  })

  // Load the appropriate URL or file based on environment
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  tray = new Tray(trayIcon) // Path to tray icon

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: (): void => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide() // Hide if already visible
          } else {
            mainWindow.show() // Show if not visible
            mainWindow.focus() // Focus the window
          }
        }
      }
    },
    {
      label: 'Quit',
      click: (): void => {
        app.quit() // Quit the application
      }
    }
  ])

  tray.setContextMenu(contextMenu)
  tray.setToolTip('My Electron App')

  // Handle tray icon click to show/hide the window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide() // Hide if already visible
      } else {
        mainWindow.show() // Show if not visible
        mainWindow.focus() // Focus the window
      }
    }
  })
}

// UNCOMMENT TO SEND DATA IN API
// const API_URL = 'https://your-api-endpoint.com/data'
// const INTERVAL_TIME = 1000

// async function sendDataToApi(data: SystemData): Promise<void> {
//   try {
//     await axios.post(API_URL, data)
//     console.log('Data successfully sent to API')
//   } catch (error) {
//     console.error('Error sending data to API:', error)
//   }
// }

// function setupAutoSend(): void {
//   // Set up an interval to send system data automatically
//   setInterval(async () => {
//     const data = await getSystemData()
//     if (data) {
//       await sendDataToApi(data)
//     }
//   }, INTERVAL_TIME) // Send data every INTERVAL_TIME milliseconds
// }

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-system-data', async () => {
    return await getSystemData()
  })

  createWindow()
  createTray()
  // setupAutoSend()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
