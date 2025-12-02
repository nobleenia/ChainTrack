/**
 * Wallet Connect Button Component
 * Shows MetaMask connection status and allows connecting/disconnecting
 */

import { useState, useEffect } from 'react'
import { Wallet, ChevronDown, LogOut, ExternalLink, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WalletConnect({ className = '' }) {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum?.isMetaMask

  // Network names mapping
  const networkNames = {
    '0x1': 'Ethereum Mainnet',
    '0x5': 'Goerli Testnet',
    '0xaa36a7': 'Sepolia Testnet',
    '0x89': 'Polygon Mainnet',
    '0x13881': 'Mumbai Testnet',
    '0x7a69': 'Hardhat Local',
    '0x539': 'Localhost 8545',
  }

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Initialize - check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled) return

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setAccount(accounts[0])
          const chain = await window.ethereum.request({ method: 'eth_chainId' })
          setChainId(chain)
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err)
      }
    }

    checkConnection()

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          setAccount(null)
        }
      })

      window.ethereum.on('chainChanged', (chain) => {
        setChainId(chain)
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [isMetaMaskInstalled])

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      setAccount(accounts[0])
      const chain = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(chain)
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected')
      } else {
        setError('Failed to connect')
      }
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect (just clear local state - MetaMask doesn't have true disconnect)
  const disconnectWallet = () => {
    setAccount(null)
    setChainId(null)
    setIsDropdownOpen(false)
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!account) return
    await navigator.clipboard.writeText(account)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Open in block explorer
  const openExplorer = () => {
    let baseUrl = 'https://etherscan.io'
    if (chainId === '0x5') baseUrl = 'https://goerli.etherscan.io'
    if (chainId === '0xaa36a7') baseUrl = 'https://sepolia.etherscan.io'
    if (chainId === '0x89') baseUrl = 'https://polygonscan.com'
    if (chainId === '0x13881') baseUrl = 'https://mumbai.polygonscan.com'
    
    window.open(`${baseUrl}/address/${account}`, '_blank')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.wallet-dropdown')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Not connected state
  if (!account) {
    return (
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
          bg-gradient-to-r from-orange-500 to-amber-500 text-white
          hover:from-orange-600 hover:to-amber-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 shadow-sm
          ${className}
        `}
      >
        {isConnecting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Wallet size={16} />
        )}
        <span className="hidden sm:inline">
          {!isMetaMaskInstalled ? 'Install MetaMask' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </span>
      </button>
    )
  }

  // Connected state
  return (
    <div className={`relative wallet-dropdown ${className}`}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
          bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400
          border border-green-200 dark:border-green-700
          hover:bg-green-100 dark:hover:bg-green-900/50
          transition-all duration-200
        `}
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-mono">{formatAddress(account)}</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white font-mono">
                    {formatAddress(account)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {networkNames[chainId] || 'Unknown Network'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={copyAddress}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {copied ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <Copy size={16} />
                )}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>

              <button
                onClick={openExplorer}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ExternalLink size={16} />
                View on Explorer
              </button>

              <hr className="my-2 dark:border-gray-700" />

              <button
                onClick={disconnectWallet}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full mt-2 px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
