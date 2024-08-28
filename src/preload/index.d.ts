import { ElectronAPI } from '@electron-toolkit/preload'

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
  hostname: string // Added property
  cpu: CpuInfo
  memory: MemoryInfo
  storage: StorageInfo[]
  network: NetworkInterface[]
}

// Extend the global Window interface
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getSystemData: () => Promise<SystemData>
    }
  }
}
