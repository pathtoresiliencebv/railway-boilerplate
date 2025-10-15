import { defineRouteConfig } from "@medusajs/admin-sdk"
// Using simple icons instead of @medusajs/icons
const ChartBar = () => <span>📊</span>
const TrendingUp = () => <span>📈</span>
const Users = () => <span>👥</span>
const ShoppingBag = () => <span>🛍️</span>
// Using simple HTML elements instead of @medusajs/ui
const Container = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 ${className || ''}`}>{children}</div>
)
const Heading = ({ level, children }: { level: string, children: React.ReactNode }) => (
  <h2 className="text-2xl font-bold mb-4">{children}</h2>
)
const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-600">{children}</p>
)
const Badge = ({ children, color }: { children: React.ReactNode, color?: string }) => (
  <span className={`px-2 py-1 rounded text-sm ${color === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
    {children}
  </span>
)
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className || ''}`}>{children}</div>
)
const Grid = ({ children, cols }: { children: React.ReactNode, cols?: number }) => (
  <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>{children}</div>
)
import { useState, useEffect } from "react"

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    newCustomers: number
    totalProducts: number
    averageOrderValue: number
    conversionRate: number
  }
  dailySales: Array<{
    date: string
    revenue: number
    orders: number
  }>
  topProducts: Array<{
    id: string
    title: string
    quantity: number
    revenue: number
  }>
  orderStatuses: {
    pending: number
    completed: number
    canceled: number
    requires_action: number
  }
  period: {
    days: number
    startDate: string
    endDate: string
  }
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedPeriod])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/admin/analytics?days=${selectedPeriod}`)
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-64">
          <Text>Loading analytics...</Text>
        </div>
      </Container>
    )
  }

  if (!analytics) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-64">
          <Text>Failed to load analytics data</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1" className="text-2xl font-bold">
            Analytics Dashboard
          </Heading>
          <Text className="text-gray-600 mt-1">
            {analytics.period.startDate} - {analytics.period.endDate}
          </Text>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-3 py-1 rounded text-sm ${
                selectedPeriod === days
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <Grid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-gray-600">Total Revenue</Text>
              <Text className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.overview.totalRevenue)}
              </Text>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-gray-600">Total Orders</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {formatNumber(analytics.overview.totalOrders)}
              </Text>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-gray-600">Total Customers</Text>
              <Text className="text-2xl font-bold text-purple-600">
                {formatNumber(analytics.overview.totalCustomers)}
              </Text>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-sm text-gray-600">Avg Order Value</Text>
              <Text className="text-2xl font-bold text-orange-600">
                {formatCurrency(analytics.overview.averageOrderValue)}
              </Text>
            </div>
            <ChartBar className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </Grid>

      {/* Additional Metrics */}
      <Grid className="grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <Text className="text-sm text-gray-600 mb-2">New Customers</Text>
          <Text className="text-xl font-bold">{formatNumber(analytics.overview.newCustomers)}</Text>
        </Card>

        <Card className="p-6">
          <Text className="text-sm text-gray-600 mb-2">Total Products</Text>
          <Text className="text-xl font-bold">{formatNumber(analytics.overview.totalProducts)}</Text>
        </Card>

        <Card className="p-6">
          <Text className="text-sm text-gray-600 mb-2">Conversion Rate</Text>
          <Text className="text-xl font-bold">{analytics.overview.conversionRate}%</Text>
        </Card>
      </Grid>

      {/* Charts and Tables */}
      <Grid className="grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Sales Chart */}
        <Card className="p-6">
          <Heading level="h3" className="text-lg font-semibold mb-4">
            Daily Sales
          </Heading>
          <div className="space-y-2">
            {analytics.dailySales.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center justify-between">
                <Text className="text-sm">{day.date}</Text>
                <div className="flex items-center gap-4">
                  <Text className="text-sm font-medium">
                    {formatCurrency(day.revenue)}
                  </Text>
                  <Badge variant="secondary">
                    {day.orders} orders
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Order Status Distribution */}
        <Card className="p-6">
          <Heading level="h3" className="text-lg font-semibold mb-4">
            Order Status Distribution
          </Heading>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text className="text-sm">Completed</Text>
              <Badge variant="success">{analytics.orderStatuses.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-sm">Pending</Text>
              <Badge variant="warning">{analytics.orderStatuses.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-sm">Requires Action</Text>
              <Badge variant="attention">{analytics.orderStatuses.requires_action}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-sm">Canceled</Text>
              <Badge variant="danger">{analytics.orderStatuses.canceled}</Badge>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Top Products */}
      <Card className="p-6">
        <Heading level="h3" className="text-lg font-semibold mb-4">
          Top Selling Products
        </Heading>
        <div className="space-y-3">
          {analytics.topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <Text className="text-sm font-medium text-gray-500">#{index + 1}</Text>
                <Text className="font-medium">{product.title}</Text>
              </div>
              <div className="flex items-center gap-4">
                <Text className="text-sm text-gray-600">
                  {formatNumber(product.quantity)} sold
                </Text>
                <Text className="text-sm font-medium">
                  {formatCurrency(product.revenue)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Analytics",
  icon: ChartBar,
})

export default AnalyticsDashboard
