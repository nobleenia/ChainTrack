/**
 * RewardsPage
 * 
 * User rewards dashboard showing points, tokens, tier status,
 * and earning history.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy,
  Coins,
  TrendingUp,
  Gift,
  Star,
  Clock,
  ArrowRight,
  Zap,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Shield,
  Users,
  Calendar,
  Award
} from 'lucide-react'
import { rewardsService } from '../services/rewardsService'
import { Button, LoadingSpinner } from '../components/common'

// Tier colors and icons
const TIER_CONFIG = {
  bronze: { color: 'from-amber-600 to-amber-700', icon: '🥉', textColor: 'text-amber-600' },
  silver: { color: 'from-gray-400 to-gray-500', icon: '🥈', textColor: 'text-gray-500' },
  gold: { color: 'from-yellow-400 to-yellow-500', icon: '🥇', textColor: 'text-yellow-500' },
  platinum: { color: 'from-cyan-400 to-cyan-500', icon: '💎', textColor: 'text-cyan-500' },
  diamond: { color: 'from-purple-400 to-pink-500', icon: '👑', textColor: 'text-purple-500' }
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState(null)
  const [history, setHistory] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [referralCode, setReferralCode] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [convertAmount, setConvertAmount] = useState('')
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [dailyBonusMessage, setDailyBonusMessage] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rewardsData, historyData, leaderboardData, referralData] = await Promise.all([
        rewardsService.getBalance(),
        rewardsService.getHistory(20),
        rewardsService.getLeaderboard(5),
        rewardsService.getReferralCode()
      ])
      setRewards(rewardsData)
      setHistory(historyData.transactions)
      setLeaderboard(leaderboardData)
      setReferralCode(referralData)
    } catch (error) {
      console.error('Failed to fetch rewards data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimDailyBonus = async () => {
    setIsClaiming(true)
    try {
      const result = await rewardsService.claimDailyBonus()
      setRewards(result.rewards)
      setDailyBonusMessage({
        type: 'success',
        text: `+${result.points_earned} points! Day ${result.current_streak} streak 🔥`
      })
      // Refresh history
      const historyData = await rewardsService.getHistory(20)
      setHistory(historyData.transactions)
    } catch (error) {
      setDailyBonusMessage({
        type: 'info',
        text: error.response?.data?.message || 'Already claimed today!'
      })
    } finally {
      setIsClaiming(false)
      setTimeout(() => setDailyBonusMessage(null), 3000)
    }
  }

  const handleConvertToTokens = async () => {
    const points = convertAmount ? parseInt(convertAmount) : null
    if (convertAmount && (isNaN(points) || points < 100)) {
      return
    }
    
    setIsConverting(true)
    try {
      const result = await rewardsService.convertToTokens(points)
      setRewards(prev => ({
        ...prev,
        current_points: result.new_point_balance,
        ctk_tokens: result.new_token_balance
      }))
      setShowConvertModal(false)
      setConvertAmount('')
      // Refresh history
      const historyData = await rewardsService.getHistory(20)
      setHistory(historyData.transactions)
    } catch (error) {
      alert(error.response?.data?.error || 'Conversion failed')
    } finally {
      setIsConverting(false)
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode?.referral_link || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading rewards..." />
      </div>
    )
  }

  const tierConfig = TIER_CONFIG[rewards?.tier] || TIER_CONFIG.bronze

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="text-gray-600">Earn points, climb tiers, convert to CTK tokens</p>
        </div>
        <Button
          onClick={handleClaimDailyBonus}
          isLoading={isClaiming}
          leftIcon={!isClaiming && <Gift size={20} />}
          className="bg-gradient-to-r from-primary-500 to-primary-600"
        >
          Claim Daily Bonus
        </Button>
      </div>

      {/* Daily Bonus Message */}
      <AnimatePresence>
        {dailyBonusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-lg ${
              dailyBonusMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {dailyBonusMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Coins size={24} className="text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase">Points</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {rewards?.current_points?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {rewards?.total_points_earned?.toLocaleString() || 0} lifetime
          </p>
        </motion.div>

        {/* CTK Tokens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap size={24} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase">CTK Tokens</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {rewards?.ctk_tokens?.toFixed(2) || '0.00'}
          </p>
          <button
            onClick={() => setShowConvertModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 mt-1 flex items-center"
          >
            Convert points <ChevronRight size={14} />
          </button>
        </motion.div>

        {/* Current Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${tierConfig.color} rounded-xl p-6 shadow-sm text-white`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">{tierConfig.icon}</span>
            <span className="text-xs font-medium text-white/80 uppercase">Tier</span>
          </div>
          <p className="text-2xl font-bold capitalize">{rewards?.tier || 'Bronze'}</p>
          <p className="text-sm text-white/80 mt-1">
            {rewards?.tier_benefits?.point_multiplier}x point multiplier
          </p>
        </motion.div>

        {/* Verifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield size={24} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-400 uppercase">Verifications</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {rewards?.stats?.total_verifications || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {rewards?.stats?.current_login_streak || 0} day streak 🔥
          </p>
        </motion.div>
      </div>

      {/* Tier Progress */}
      {rewards?.next_tier_progress?.next_tier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Progress to {rewards.next_tier_progress.next_tier}</h3>
            <span className="text-sm text-gray-500">
              {rewards.next_tier_progress.points_needed.toLocaleString()} points needed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`bg-gradient-to-r ${tierConfig.color} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${rewards.next_tier_progress.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {rewards.next_tier_progress.progress.toFixed(1)}% complete
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No activity yet. Start verifying products to earn points!</p>
              </div>
            ) : (
              history.map((tx, index) => (
                <div key={tx.id || index} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.points > 0 ? (
                        <TrendingUp size={16} className="text-green-600" />
                      ) : (
                        <ArrowRight size={16} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {tx.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Referral Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-gray-400" />
              Refer Friends
            </h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Share your referral link and earn <span className="font-semibold text-primary-600">200 points</span> when your friends verify their first product!
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-gray-500 mb-2">Your referral code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {referralCode?.referral_code || 'Loading...'}
                </code>
                <button
                  onClick={copyReferralCode}
                  className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Award size={16} />
              <span>You've referred <strong>{rewards?.stats?.total_referrals || 0}</strong> friends</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Top Verifiers
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {leaderboard.map((user, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-amber-100 text-amber-600' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{user.user_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.tier} • {user.verifications} verifications</p>
                </div>
              </div>
              <span className="font-semibold text-gray-900">{user.total_points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Convert Modal */}
      <AnimatePresence>
        {showConvertModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-4">Convert Points to CTK Tokens</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">1,000 points = 1 CTK</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points to convert
                </label>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder={`Max: ${rewards?.current_points || 0}`}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  min="100"
                  max={rewards?.current_points}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to convert all points
                </p>
              </div>

              {convertAmount && !isNaN(parseInt(convertAmount)) && (
                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary-700">
                    You'll receive: <strong>{(parseInt(convertAmount) / 1000).toFixed(4)} CTK</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowConvertModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleConvertToTokens}
                  isLoading={isConverting}
                  disabled={rewards?.current_points < 100}
                >
                  Convert
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
