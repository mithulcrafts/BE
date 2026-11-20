import { Web3 } from 'web3'
import { SupplyChainArtifact } from './contracts'
import deployments from '../deployments.json'

declare global {
  interface Window {
    ethereum?: any
    web3?: any
  }
}

export const getWeb3Instance = (): Web3 => {
  if (typeof window === 'undefined') {
    throw new Error('Web3 can only be used in client components')
  }
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask!')
  }
  return new Web3(window.ethereum)
}

export const loadWeb3 = async (): Promise<Web3> => {
  if (typeof window === 'undefined') {
    throw new Error('Web3 can only be used in client components')
  }
  if (!window.ethereum) {
    window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    throw new Error('MetaMask not detected')
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' })
  const web3 = new Web3(window.ethereum)
  window.web3 = web3
  return web3
}

export const getActiveAccount = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  // Check current accounts connected to this dApp
  const existing = (await window.ethereum.request({ method: 'eth_accounts' })) as string[]
  const selected = window.ethereum.selectedAddress

  // If MetaMask has an active selected account and it is connected, use it
  if (selected && existing.some((acc) => acc.toLowerCase() === selected.toLowerCase())) {
    return selected
  }

  if (existing && existing.length > 0) return existing[0]

  // If not connected yet, request access (prompts MetaMask).
  const requested = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[]
  if (requested && requested.length > 0) return window.ethereum.selectedAddress || requested[0]

  throw new Error('No active account found. Please connect MetaMask.')
}

export const getContract = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Contract access is only available on client-side')
  }

  if (!window.ethereum) {
    throw new Error('MetaMask is not installed. Please install MetaMask to use this application.')
  }

  const web3 = new Web3(window.ethereum)
  window.web3 = web3

  let chainIdStr = '1337'
  try {
    const chainIdHex = (await window.ethereum.request({ method: 'eth_chainId' })) as string
    if (chainIdHex) {
      chainIdStr = parseInt(chainIdHex, 16).toString()
    }
  } catch {
    try {
      const cid = await web3.eth.getChainId()
      chainIdStr = cid.toString()
    } catch (e) {
      console.warn('Could not detect chainId dynamically, defaulting to 1337', e)
    }
  }

  const networkData = deployments.networks[chainIdStr as keyof typeof deployments.networks]

  if (networkData && networkData.SupplyChain && networkData.SupplyChain.address) {
    const contract = new web3.eth.Contract(SupplyChainArtifact.abi as any, networkData.SupplyChain.address)
    return { contract, web3 }
  } else {
    const availableNetworks = Object.keys(deployments.networks).join(', ')
    throw new Error(
      `Contract not found on chainId ${chainIdStr}.\n\n` +
      `Available networks: ${availableNetworks}\n` +
      `Please switch MetaMask to one of these networks or deploy the contract to chainId ${chainIdStr}.\n\n` +
      `To deploy: npx hardhat run scripts/deploy.ts --network <network>`
    )
  }
}

export const switchToNetwork = async (chainId: string | number) => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed')
  }

  const chainIdNum = Number(chainId)
  const chainIdHex = `0x${chainIdNum.toString(16)}`
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (switchError: any) {
    // Error code 4902 indicates chain has not been added to MetaMask yet
    if (switchError.code === 4902 || switchError?.message?.includes('Unrecognized chain ID')) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: chainIdNum === 1337 || chainIdNum === 5777 ? 'Localhost 1337' : 'Hardhat Local',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['http://127.0.0.1:8545'],
            },
          ],
        })
      } catch (addError) {
        throw new Error('Failed to add network to MetaMask. Please add RPC http://127.0.0.1:8545 manually.')
      }
    } else {
      throw switchError
    }
  }
}
