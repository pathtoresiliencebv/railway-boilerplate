import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Table, Badge } from "@medusajs/ui"
import { Building } from "@medusajs/icons"
import { useState, useEffect } from "react"

const StoresManagement = () => {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await fetch("/admin/stores")
      const data = await response.json()
      setStores(data.stores)
    } catch (error) {
      console.error("Error fetching stores:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Heading level="h1">Loading stores...</Heading>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Heading level="h1">Multi-Store Management</Heading>
        <Button onClick={() => {/* TODO: Open create modal */}}>
          Create Store
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Subdomain</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Currencies</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {stores.map((store) => (
            <Table.Row key={store.id}>
              <Table.Cell>{store.name}</Table.Cell>
              <Table.Cell>
                {store.config?.subdomain ? 
                  `${store.config.subdomain}.myaurelio.com` : 
                  'No subdomain'
                }
              </Table.Cell>
              <Table.Cell>
                <Badge variant={store.config?.is_active ? "success" : "danger"}>
                  {store.config?.is_active ? "Active" : "Inactive"}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                {store.supported_currencies?.map(c => c.currency_code).join(", ")}
              </Table.Cell>
              <Table.Cell>
                <Button size="small" onClick={() => {/* TODO: Edit */}}>
                  Edit
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Stores",
  icon: Building,
  path: "/stores",
})

export default StoresManagement
