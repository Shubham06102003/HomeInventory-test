'use client'

import { useState, useEffect } from 'react'
import { uploadToCloudinary } from '@/lib/uploadToCloudinary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, X, Image, MapPin } from 'lucide-react'

export default function EditItemForm({ item, family, onSuccess, onCancel }) {
    const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Simple check for mobile or tablet
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        const ua = navigator.userAgent
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        setIsMobile(
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) && isTouch
        )
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    location: '',
    itemImageFile: null,
    placeImageFile: null,
    itemImageUrl: '',
    placeImageUrl: ''
  })
  const [itemImagePreview, setItemImagePreview] = useState('')
  const [placeImagePreview, setPlaceImagePreview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        tags: item.tags || '',
        location: item.location || '',
        itemImageFile: null,
        placeImageFile: null,
        itemImageUrl: item.itemImageUrl || '',
        placeImageUrl: item.placeImageUrl || ''
      })
      setItemImagePreview(item.itemImageUrl ? item.itemImageUrl : (item.itemImageBase64 ? `data:image/jpeg;base64,${item.itemImageBase64}` : ''))
      setPlaceImagePreview(item.placeImageUrl ? item.placeImageUrl : (item.placeImageBase64 ? `data:image/jpeg;base64,${item.placeImageBase64}` : ''))
    }
  }, [item])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (type === 'item') {
        setFormData(prev => ({ ...prev, itemImageFile: file }))
        setItemImagePreview(event.target.result)
      } else if (type === 'place') {
        setFormData(prev => ({ ...prev, placeImageFile: file }))
        setPlaceImagePreview(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type) => {
    if (type === 'item') {
      setFormData(prev => ({ ...prev, itemImageFile: null, itemImageUrl: '' }))
      setItemImagePreview('')
    } else if (type === 'place') {
      setFormData(prev => ({ ...prev, placeImageFile: null, placeImageUrl: '' }))
      setPlaceImagePreview('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Item name is required')
      return
    }
    setSubmitting(true)
    let itemImageUrl = formData.itemImageUrl
    let placeImageUrl = formData.placeImageUrl
    try {
      if (formData.itemImageFile) {
        itemImageUrl = await uploadToCloudinary(formData.itemImageFile)
      }
      if (formData.placeImageFile) {
        placeImageUrl = await uploadToCloudinary(formData.placeImageFile)
      }
      const response = await fetch(`/api/items/edit/${item.id}` , {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          itemImageUrl,
          placeImageUrl,
          familyId: family.id
        })
      })
      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Name */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium">
          Item Name *
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., Blue Winter Jacket"
          required
          className="mt-1"
        />
      </div>
      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Brief description of the item..."
          className="mt-1"
          rows={3}
        />
      </div>
      {/* Location */}
      <div>
        <Label htmlFor="location" className="text-sm font-medium">
          Location
        </Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="e.g., Bedroom closet, Kitchen cabinet"
          className="mt-1"
        />
      </div>
      {/* Tags */}
      <div>
        <Label htmlFor="tags" className="text-sm font-medium">
          Tags
        </Label>
        <Input
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleInputChange}
          placeholder="e.g., clothing, winter, outdoor"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Separate tags with commas to make items easier to find
        </p>
      </div>
      {/* Item Photo Upload */}
      <div>
        <Label className="text-sm font-medium">Item Photo</Label>
        <div className="mt-2">
          {itemImagePreview ? (
            <Card className="relative">
              <CardContent className="p-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={itemImagePreview}
                    alt="Item preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage('item')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Item photo uploaded
                </p>
              </CardContent>
            </Card>
          ) : (
            isMobile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2 flex flex-col items-center w-full">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('itemImageCamera').click()} className="mb-2 w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={() => document.getElementById('itemImageGallery').click()} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose from Gallery
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Photo of the actual item (PNG, JPG up to 5MB)
                  </p>
                </div>
                <input
                  id="itemImageCamera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e, 'item')}
                  className="hidden"
                />
                <input
                  id="itemImageGallery"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'item')}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="itemImageDesktop" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Item Photo
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-gray-500">
                    Photo of the actual item (PNG, JPG up to 5MB)
                  </p>
                </div>
                <input
                  id="itemImageDesktop"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'item')}
                  className="hidden"
                />
              </div>
            )
          )}
        </div>
      </div>
      {/* Place Photo Upload */}
      <div>
        <Label className="text-sm font-medium">Location Photo</Label>
        <div className="mt-2">
          {placeImagePreview ? (
            <Card className="relative">
              <CardContent className="p-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={placeImagePreview}
                    alt="Place preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage('place')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location photo uploaded
                </p>
              </CardContent>
            </Card>
          ) : (
            isMobile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2 flex flex-col items-center w-full">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('placeImageCamera').click()} className="mb-2 w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button type="button" variant="outline" onClick={() => document.getElementById('placeImageGallery').click()} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose from Gallery
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Photo showing where the item is stored (PNG, JPG up to 5MB)
                  </p>
                </div>
                <input
                  id="placeImageCamera"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e, 'place')}
                  className="hidden"
                />
                <input
                  id="placeImageGallery"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'place')}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="placeImageDesktop" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Location Photo
                      </span>
                    </Button>
                  </Label>
                  <p className="text-xs text-gray-500">
                    Photo showing where the item is stored (PNG, JPG up to 5MB)
                  </p>
                </div>
                <input
                  id="placeImageDesktop"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'place')}
                  className="hidden"
                />
              </div>
            )
          )}
        </div>
      </div>
      {/* Submit & Cancel Buttons */}
      <div className="flex justify-end pt-4 gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={submitting}
          className="min-w-[120px]"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
