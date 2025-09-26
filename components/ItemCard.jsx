'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Tag, User, Calendar, Package } from 'lucide-react'

export default function ItemCard({ item, showDate = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {item.itemImageBase64 ? (
          <img 
            src={`data:image/jpeg;base64,${item.itemImageBase64}`}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {showDate && (
          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
            {formatDate(item.createdAt)}
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight truncate">{item.name}</CardTitle>
            <CardDescription className="mt-1 text-sm">
              {item.description && (
                <span className="line-clamp-2">{item.description}</span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Location */}
          {item.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}

          {/* Tags */}
          {item.tags && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{item.tags}</span>
            </div>
          )}

          {/* Added By */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">Added by {item.addedByName}</span>
          </div>

          {/* Date (if not already shown as badge) */}
          {!showDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{formatDate(item.createdAt)}</span>
            </div>
          )}

          {/* Place Image */}
          {item.placeImageBase64 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Location photo:</p>
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                <img 
                  src={`data:image/jpeg;base64,${item.placeImageBase64}`}
                  alt={`Location of ${item.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}