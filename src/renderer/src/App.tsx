import { useEffect, useState } from 'react'

// Define the structure of your system data
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

function App(): JSX.Element {
  const [systemData, setSystemData] = useState<SystemData | null>(null)

  useEffect(() => {
    const fetchSystemData = async (): Promise<void> => {
      const data = await window.api.getSystemData()
      setSystemData(data)
    }
    fetchSystemData()
    const interval = setInterval(() => {
      fetchSystemData()
    }, 5000)

    return (): void => clearInterval(interval)
  }, [])

  if (!systemData) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div>
        <h1>System Monitor</h1>
        <h2>CPU</h2>
        <p>{systemData.hostname ? systemData.hostname : <>No Name</>}</p>
        <pre>{JSON.stringify(systemData.cpu, null, 2)}</pre>
        <h2>Memory</h2>
        <pre>{JSON.stringify(systemData.memory, null, 2)}</pre>
        <h2>Storage</h2>
        <pre>{JSON.stringify(systemData.storage, null, 2)}</pre>
        <h2>Network</h2>
        <pre>{JSON.stringify(systemData.network, null, 2)}</pre>
      </div>
    </>
  )
}

export default App
