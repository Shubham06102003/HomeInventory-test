
'use client';

import { useEffect, useState } from 'react'

import Header from '@/components/ui/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Calendar, MapPin, Tag, Package, X } from 'lucide-react'

export default function ItemDetailPage({ params }) {
  const { id } = params
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')

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
                  className="w-full aspect-video object-cover rounded mb-4 cursor-pointer"
                  onClick={() => {
                    setPreviewSrc(`data:image/jpeg;base64,${item.itemImageBase64}`)
                    setShowPreview(true)
                  }}
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
                      className="w-full aspect-video object-cover rounded cursor-pointer"
                      onClick={() => {
                        setPreviewSrc(`data:image/jpeg;base64,${item.placeImageBase64}`)
                        setShowPreview(true)
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Image Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="relative max-w-2xl w-full">
              <button
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-100 z-10"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <img
                src={previewSrc}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
