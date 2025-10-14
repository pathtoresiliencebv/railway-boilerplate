import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Clock, CheckCircle, XCircle, AlertCircle } from "@medusajs/icons"
import { Container, Heading, Text, Card, Badge, Button } from "@medusajs/ui"
import { useState, useEffect } from "react"

interface RecentOrder {
  id: string
  display_id: number
  status: string
  total: number
  currency_code: string
  created_at: string
  email: string
  customer?: {
    first_name: string
    last_name: string
  }
}

const RecentOrdersWidget = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch('/admin/orders?limit=5&order=-created_at')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching recent orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'requires_action':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'canceled':
        return <Badge variant="danger">Canceled</Badge>
      case 'requires_action':
        return <Badge variant="attention">Action Required</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-32">
          <Text>Loading recent orders...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2" className="text-xl font-semibold">
          Recent Orders
        </Heading>
        <Button variant="secondary" size="small">
          View All
        </Button>
      </div>
      
      <div className="space-y-3">
        {orders.length === 0 ? (
          <Text className="text-gray-500 text-center py-4">
            No recent orders found
          </Text>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <Text className="font-medium">
                      #{order.display_id}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {order.customer 
                        ? `${order.customer.first_name} ${order.customer.last_name}`
                        : order.email
                      }
                    </Text>
                  </div>
                </div>
                <div className="text-right">
                  <Text className="font-medium">
                    {formatCurrency(order.total, order.currency_code)}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </Text>
                </div>
                <div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "dashboard.after",
})

export default RecentOrdersWidget
