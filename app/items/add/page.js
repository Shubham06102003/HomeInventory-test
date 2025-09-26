'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Home, Upload, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import AddItemForm from '@/components/AddItemForm'

export default function AddItemPage() {
  const { user } = useUser()
  const router = useRouter()
  const [family, setFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFamily()
    }
  }, [user])

  const fetchFamily = async () => {
    try {
      const response = await fetch('/api/family/user')
      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
      } else {
        toast.error('Please join or create a family first')
        router.push('/family')
      }
    } catch (error) {
      console.error('Error fetching family:', error)
      toast.error('Failed to load family')
    }
    setLoading(false)
  }

  const handleItemAdded = () => {
    toast.success('Item added successfully!')
    router.push('/items')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
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
                <Link href="/items/latest" className="text-gray-600 hover:text-gray-900">Latest</Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
              </nav>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Link href="/items" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Items
          </Link>

          {/* Page Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Add New Item</h2>
            <p className="text-gray-600">Add a household item to your family inventory</p>
          </div>

          {/* Add Item Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
              <CardDescription>
                Fill in the details about your item. Both photos help identify the item and its location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddItemForm family={family} onSuccess={handleItemAdded} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}