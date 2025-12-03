import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  ChartPieIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { format, subDays, startOfWeek, startOfMonth, parseISO, differenceInDays } from 'date-fns'
import api from '../../services/api'

// Color palette for charts
const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  gray: '#6b7280'
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_transit: '#3b82f6',
  delivered: '#10b981',
  confirmed: '#059669',
  cancelled: '#ef4444'
}

function ShipmentAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [dateRange, setDateRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/shipments/analytics', {
        params: { days: parseInt(dateRange) }
      })
      setAnalytics(response.data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      // Generate mock data for demo if API fails
      setAnalytics(generateMockAnalytics(parseInt(dateRange)))
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data for demonstration
  const generateMockAnalytics = (days) => {
    const dailyData = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const baseShipments = Math.floor(Math.random() * 15) + 5
      const deliveryRate = 0.7 + Math.random() * 0.25
      
      dailyData.push({
        date: format(date, 'yyyy-MM-dd'),
        dateLabel: format(date, 'MMM dd'),
        created: baseShipments,
        delivered: Math.floor(baseShipments * deliveryRate),
        inTransit: Math.floor(baseShipments * (1 - deliveryRate)),
        avgDeliveryTime: Math.floor(Math.random() * 48) + 24,
        revenue: baseShipments * (Math.random() * 50 + 20)
      })
    }
    
    const totalCreated = dailyData.reduce((sum, d) => sum + d.created, 0)
    const totalDelivered = dailyData.reduce((sum, d) => sum + d.delivered, 0)
    const avgDeliveryTime = dailyData.reduce((sum, d) => sum + d.avgDeliveryTime, 0) / days
    
    return {
      summary: {
        totalShipments: totalCreated,
        activeShipments: Math.floor(totalCreated * 0.15),
        deliveredShipments: totalDelivered,
        confirmedShipments: Math.floor(totalDelivered * 0.85),
        cancelledShipments: Math.floor(totalCreated * 0.05),
        deliveryRate: (totalDelivered / totalCreated) * 100,
        avgDeliveryTime: avgDeliveryTime,
        onTimeDeliveryRate: 78 + Math.random() * 15,
        totalRevenue: dailyData.reduce((sum, d) => sum + d.revenue, 0)
      },
      trends: {
        shipmentsChange: Math.floor(Math.random() * 30) - 10,
        deliveryRateChange: Math.floor(Math.random() * 10) - 3,
        avgTimeChange: Math.floor(Math.random() * 20) - 8
      },
      dailyData,
      statusBreakdown: [
        { name: 'Delivered', value: totalDelivered, color: STATUS_COLORS.delivered },
        { name: 'In Transit', value: Math.floor(totalCreated * 0.12), color: STATUS_COLORS.in_transit },
        { name: 'Pending', value: Math.floor(totalCreated * 0.03), color: STATUS_COLORS.pending },
        { name: 'Confirmed', value: Math.floor(totalDelivered * 0.85), color: STATUS_COLORS.confirmed },
        { name: 'Cancelled', value: Math.floor(totalCreated * 0.05), color: STATUS_COLORS.cancelled }
      ],
      topRoutes: [
        { origin: 'Lagos', destination: 'Abuja', count: Math.floor(Math.random() * 50) + 20, avgTime: 36 },
        { origin: 'Port Harcourt', destination: 'Lagos', count: Math.floor(Math.random() * 40) + 15, avgTime: 28 },
        { origin: 'Kano', destination: 'Lagos', count: Math.floor(Math.random() * 35) + 10, avgTime: 48 },
        { origin: 'Lagos', destination: 'Ibadan', count: Math.floor(Math.random() * 30) + 12, avgTime: 8 },
        { origin: 'Abuja', destination: 'Kaduna', count: Math.floor(Math.random() * 25) + 8, avgTime: 12 }
      ],
      courierPerformance: [
        { name: 'FastTrack Logistics', deliveries: Math.floor(Math.random() * 100) + 50, rating: 4.8, onTime: 95 },
        { name: 'SwiftMove Express', deliveries: Math.floor(Math.random() * 80) + 40, rating: 4.6, onTime: 88 },
        { name: 'QuickShip Nigeria', deliveries: Math.floor(Math.random() * 60) + 30, rating: 4.5, onTime: 82 },
        { name: 'Express Delivery Co', deliveries: Math.floor(Math.random() * 40) + 20, rating: 4.3, onTime: 76 }
      ],
      weeklyComparison: Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${i + 1}`,
        current: Math.floor(Math.random() * 80) + 40,
        previous: Math.floor(Math.random() * 70) + 35
      })),
      deliveryTimeDistribution: [
        { range: '0-12h', count: Math.floor(Math.random() * 20) + 10 },
        { range: '12-24h', count: Math.floor(Math.random() * 40) + 25 },
        { range: '24-48h', count: Math.floor(Math.random() * 35) + 20 },
        { range: '48-72h', count: Math.floor(Math.random() * 15) + 5 },
        { range: '72h+', count: Math.floor(Math.random() * 8) + 2 }
      ]
    }
  }

  const exportData = (format) => {
    if (!analytics) return
    
    const data = {
      exportDate: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      ...analytics
    }
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `shipment-analytics-${format}.json`)
    } else if (format === 'csv') {
      const csvData = convertToCSV(analytics.dailyData)
      const blob = new Blob([csvData], { type: 'text/csv' })
      downloadBlob(blob, `shipment-analytics-${format}.csv`)
    }
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    return [headers, ...rows].join('\n')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Failed to load analytics</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
        <button onClick={fetchAnalytics} className="mt-4 btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  const { summary, trends, dailyData, statusBreakdown, topRoutes, courierPerformance, weeklyComparison, deliveryTimeDistribution } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-primary-600" />
            Shipment Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track performance and insights across your shipments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
          
          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportData('csv')}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportData('json')}
                className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 last:rounded-b-lg"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={CubeIcon}
          title="Total Shipments"
          value={summary.totalShipments}
          trend={trends.shipmentsChange}
          trendLabel="vs last period"
          color="blue"
        />
        <SummaryCard
          icon={CheckCircleIcon}
          title="Delivered"
          value={summary.deliveredShipments}
          subtitle={`${summary.deliveryRate.toFixed(1)}% delivery rate`}
          color="green"
        />
        <SummaryCard
          icon={ClockIcon}
          title="Avg Delivery Time"
          value={`${summary.avgDeliveryTime.toFixed(1)}h`}
          trend={trends.avgTimeChange}
          trendLabel="hours"
          trendInverse
          color="amber"
        />
        <SummaryCard
          icon={ArrowTrendingUpIcon}
          title="On-Time Rate"
          value={`${summary.onTimeDeliveryRate.toFixed(1)}%`}
          trend={trends.deliveryRateChange}
          trendLabel="vs last period"
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'delivery', label: 'Delivery Performance', icon: TruckIcon },
            { id: 'routes', label: 'Routes & Regions', icon: MapPinIcon },
            { id: 'couriers', label: 'Courier Performance', icon: UserGroupIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab
            dailyData={dailyData}
            statusBreakdown={statusBreakdown}
            weeklyComparison={weeklyComparison}
          />
        )}
        {activeTab === 'delivery' && (
          <DeliveryTab
            dailyData={dailyData}
            deliveryTimeDistribution={deliveryTimeDistribution}
            summary={summary}
          />
        )}
        {activeTab === 'routes' && (
          <RoutesTab topRoutes={topRoutes} />
        )}
        {activeTab === 'couriers' && (
          <CouriersTab courierPerformance={courierPerformance} />
        )}
      </div>
    </div>
  )
}

// Summary Card Component
function SummaryCard({ icon: Icon, title, value, subtitle, trend, trendLabel, trendInverse = false, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
  }

  const isPositive = trendInverse ? trend < 0 : trend > 0
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trendLabel && trend !== undefined && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  )
}

// Overview Tab
function OverviewTab({ dailyData, statusBreakdown, weeklyComparison }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Shipment Trend Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shipment Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="created"
              stroke={COLORS.primary}
              fillOpacity={1}
              fill="url(#colorCreated)"
              name="Created"
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke={COLORS.secondary}
              fillOpacity={1}
              fill="url(#colorDelivered)"
              name="Delivered"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown Pie Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusBreakdown}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {statusBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {statusBreakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Comparison */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Comparison</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyComparison} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
            />
            <Legend />
            <Bar dataKey="current" fill={COLORS.primary} name="This Period" radius={[4, 4, 0, 0]} />
            <Bar dataKey="previous" fill={COLORS.gray} name="Last Period" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Delivery Performance Tab
function DeliveryTab({ dailyData, deliveryTimeDistribution, summary }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Delivery Time Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Average Delivery Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="dateLabel" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} unit="h" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
              formatter={(value) => [`${value}h`, 'Delivery Time']}
            />
            <Line
              type="monotone"
              dataKey="avgDeliveryTime"
              stroke={COLORS.warning}
              strokeWidth={2}
              dot={{ fill: COLORS.warning, strokeWidth: 2 }}
              name="Avg Time (hours)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delivery Time Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deliveryTimeDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis dataKey="range" type="category" stroke="#6b7280" fontSize={12} width={60} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
            />
            <Bar dataKey="count" fill={COLORS.cyan} radius={[0, 4, 4, 0]} name="Shipments" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Delivery Rate"
            value={`${summary.deliveryRate.toFixed(1)}%`}
            description="Successfully delivered"
            color="green"
          />
          <MetricCard
            label="On-Time Delivery"
            value={`${summary.onTimeDeliveryRate.toFixed(1)}%`}
            description="Within expected time"
            color="blue"
          />
          <MetricCard
            label="Active Shipments"
            value={summary.activeShipments}
            description="Currently in transit"
            color="amber"
          />
          <MetricCard
            label="Confirmed"
            value={summary.confirmedShipments}
            description="Receiver confirmed"
            color="emerald"
          />
        </div>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ label, value, description, color }) {
  const colorClasses = {
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
    emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{description}</p>
    </div>
  )
}

// Routes Tab
function RoutesTab({ topRoutes }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Routes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Routes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Route</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Shipments</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {topRoutes.map((route, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {route.origin} → {route.destination}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{route.count}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{route.avgTime}h</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Volume Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Route Volume</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRoutes} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis 
              dataKey={(d) => `${d.origin.substring(0, 3)}-${d.destination.substring(0, 3)}`}
              type="category" 
              stroke="#6b7280" 
              fontSize={12}
              width={70}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
              formatter={(value, name, props) => [value, `${props.payload.origin} → ${props.payload.destination}`]}
            />
            <Bar dataKey="count" fill={COLORS.purple} radius={[0, 4, 4, 0]} name="Shipments" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Couriers Tab
function CouriersTab({ courierPerformance }) {
  return (
    <div className="space-y-6">
      {/* Courier Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {courierPerformance.map((courier, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{courier.name}</h4>
                <p className="text-2xl font-bold text-primary-600 mt-2">{courier.deliveries}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Deliveries</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">★ {courier.rating}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">On-Time Rate</span>
                <span className="text-gray-900 dark:text-white font-medium">{courier.onTime}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    courier.onTime >= 90 ? 'bg-green-500' :
                    courier.onTime >= 75 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${courier.onTime}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Courier Comparison Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Courier Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={courierPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} angle={-15} textAnchor="end" height={60} />
            <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none', 
                borderRadius: '8px',
                color: '#fff' 
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="deliveries" fill={COLORS.primary} name="Deliveries" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="onTime" stroke={COLORS.warning} strokeWidth={2} name="On-Time %" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ShipmentAnalyticsPage
