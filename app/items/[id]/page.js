
'use client';

import { useEffect, useState } from 'react'
import Header from '@/components/ui/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin, Tag, User, Calendar, Package } from 'lucide-react'

export default function ItemDetailPage({ params }) {
  const { id } = params
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/items/by-id?id=${id}`)
        if (res.ok) {
          const data = await res.json()
          setItem(data.item)
        } else {
          setItem(null)
        }
      } catch (err) {
        setItem(null)
      }
      setLoading(false)
    }
    fetchItem()
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!item) {
    return <div className="min-h-screen flex items-center justify-center">Item not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Item Details" navLinks={[]} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <a href="/items" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Items
            </a>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold mb-2">{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.itemImageBase64 ? (
                <img
                  src={`data:image/jpeg;base64,${item.itemImageBase64}`}
                  alt={item.name}
                  className="w-full aspect-video object-cover rounded mb-4"
                />
              ) : (
                <div className="w-full aspect-video flex items-center justify-center bg-gray-200 rounded mb-4">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>Added by {item.addedByName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                {item.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.tags && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span>{item.tags}</span>
                  </div>
                )}
                {item.placeImageBase64 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Location photo:</p>
                    <img
                      src={`data:image/jpeg;base64,${item.placeImageBase64}`}
                      alt={`Location of ${item.name}`}
                      className="w-full aspect-video object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
