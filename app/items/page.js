'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Home, Package, Search, Plus, MapPin, Tag, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import ItemCard from '@/components/ItemCard'
import EditItemForm from '@/components/EditItemForm'
import SearchBar from '@/components/SearchBar'

export default function ItemsPage() {
  const { user } = useUser()
  const [items, setItems] = useState([])
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredItems, setFilteredItems] = useState([])
  const [editingItem, setEditingItem] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (user) {
      fetchFamily()
    }
  }, [user])

  useEffect(() => {
    if (family) {
      fetchItems()
    }
  }, [family])

  useEffect(() => {
    // Filter items based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.addedByName.toLowerCase().includes(query)
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [searchQuery, items])

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

  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/items/family/${family.id}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
        setFilteredItems(data.items)
      } else {
        toast.error('Failed to load items')
      }
    } catch (error) {
      console.error('Error fetching items:', error)
      toast.error('Failed to load items')
    }
    setLoading(false)
  }

  const handleSearch = async (query) => {
    if (!family) return

    setLoading(true)
    try {
      const response = await fetch(`/api/items/search?query=${encodeURIComponent(query)}&familyId=${family.id}`)
      if (response.ok) {
        const data = await response.json()
        setItems(data.items)
        setFilteredItems(data.items)
        setSearchQuery(query)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching items:', error)
      toast.error('Search failed')
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
          <p className="text-gray-600">Loading items...</p>
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
                <Link href="/items/latest" className="text-gray-600 hover:text-gray-900">Latest</Link>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Family Items</h2>
            <p className="text-gray-600">{family.name} • {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/items/add">
            <Button className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <SearchBar onSearch={handleSearch} />
            {searchQuery && (
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary">
                  <Search className="h-3 w-3 mr-1" />
                  {searchQuery}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery('')
                    fetchItems()
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={(itm) => {
                  setEditingItem(itm)
                  setShowEditModal(true)
                }}
                onDelete={async (itm) => {
                  if (!window.confirm('Are you sure you want to delete this item?')) return
                  try {
                    const response = await fetch(`/api/items/delete/${itm.id}`, {
                      method: 'DELETE',
                      headers: {
                        'x-family-id': family.id
                      }
                    })
                    if (response.ok) {
                      toast.success('Item deleted successfully!')
                      fetchItems()
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Failed to delete item')
                    }
                  } catch (error) {
                    toast.error('Failed to delete item')
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No items found' : 'No items yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start by adding your first household item'
                }
              </p>
              {!searchQuery && (
                <Link href="/items/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Item Modal */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingItem(null)
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <EditItemForm
                item={editingItem}
                family={family}
                onSuccess={() => {
                  setShowEditModal(false)
                  setEditingItem(null)
                  fetchItems()
                  toast.success('Item updated successfully!')
                }}
                onCancel={() => {
                  setShowEditModal(false)
                  setEditingItem(null)
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}