import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { TrendingUp, ShoppingBag, Users, DollarSign } from "@medusajs/icons"
import { Container, Heading, Text, Card, Grid, Badge } from "@medusajs/ui"
import { useState, useEffect } from "react"

interface QuickStats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
}

const AnalyticsOverviewWidget = () => {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuickStats()
  }, [])

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/admin/analytics?days=30')
      const data = await response.json()
      setStats({
        totalRevenue: data.overview.totalRevenue,
        totalOrders: data.overview.totalOrders,
        totalCustomers: data.overview.totalCustomers,
        averageOrderValue: data.overview.averageOrderValue
      })
    } catch (error) {
      console.error('Error fetching quick stats:', error)
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
        <div className="flex items-center justify-center h-32">
          <Text>Loading analytics...</Text>
        </div>
      </Container>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2" className="text-xl font-semibold">
          Quick Analytics
        </Heading>
        <Badge variant="secondary">Last 30 days</Badge>
      </div>
      
      <Grid className="grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <div>
              <Text className="text-sm text-gray-600">Revenue</Text>
              <Text className="text-lg font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
            <div>
              <Text className="text-sm text-gray-600">Orders</Text>
              <Text className="text-lg font-bold text-blue-600">
                {formatNumber(stats.totalOrders)}
              </Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <Text className="text-sm text-gray-600">Customers</Text>
              <Text className="text-lg font-bold text-purple-600">
                {formatNumber(stats.totalCustomers)}
              </Text>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-orange-600" />
            <div>
              <Text className="text-sm text-gray-600">Avg Order</Text>
              <Text className="text-lg font-bold text-orange-600">
                {formatCurrency(stats.averageOrderValue)}
              </Text>
            </div>
          </div>
        </Card>
      </Grid>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "dashboard.before",
})

export default AnalyticsOverviewWidget
