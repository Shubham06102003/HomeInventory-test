'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Home, Clock, Package, Plus } from 'lucide-react'
import Link from 'next/link'
import ItemCard from '@/components/ItemCard'

export default function LatestItemsPage() {
  const { user } = useUser()
  const [items, setItems] = useState([])
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFamily()
    }
  }, [user])

  useEffect(() => {
    if (family) {
      fetchLatestItems()
    }
  }, [family])

  const fetchFamily = async () => {
    try {
      const response = await fetch('/api/family/user')
      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
      } else {
        toast.error('Please join or create a family first')
      }
    } catch (error) {
      console.error('Error fetching family:', error)
      toast.error('Failed to load family')
    }
  }

  const fetchLatestItems = async () => {
    try {
      const response = await fetch(`/api/items/family/${family.id}/latest`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
      } else {
        toast.error('Failed to load latest items')
      }
    } catch (error) {
      console.error('Error fetching latest items:', error)
      toast.error('Failed to load latest items')
    }
    setLoading(false)
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Family Found</h2>
            <p className="text-gray-600 mb-4">You need to join or create a family first</p>
            <Link href="/family">
              <Button>Go to Family</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading latest items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Home Inventory</h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-4">
                <Link href="/family" className="text-gray-600 hover:text-gray-900">Family</Link>
                <Link href="/items" className="text-gray-600 hover:text-gray-900">Items</Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
              </nav>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Latest Items
            </h2>
            <p className="text-gray-600">{family.name} • {items.length} recent item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/items/add">
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Latest Items Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} showDate={true} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first household item</p>
              <Link href="/items/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}