'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Home, User, LogOut, Shield } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/ui/Header'

export default function SettingsPage() {
  const { user } = useUser()
  const [family, setFamily] = useState(null)

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
      }
    } catch (error) {
      console.error('Error fetching family:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title="Home Inventory"
        navLinks={family ? [
          { href: '/items', label: 'Items' },
          { href: '/items/latest', label: 'Latest' },
          { href: '/settings', label: 'Settings' }
        ] : []}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
            <p className="text-gray-600">Manage your account and family settings</p>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {/* <CardDescription>
                  Your profile information is managed by Clerk authentication
                </CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {user?.imageUrl && (
                      <img 
                        src={user.imageUrl} 
                        alt={user.fullName || user.emailAddresses?.[0]?.emailAddress}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.fullName || user?.firstName || 'User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user?.emailAddresses?.[0]?.emailAddress}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Account Settings</p>
                      <p className="text-sm text-gray-500">Manage your account details and security</p>
                    </div>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10'
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Family Settings */}
            {family && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Family Settings
                  </CardTitle>
                  <CardDescription>
                    Current family: {family.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Family Dashboard</p>
                        <p className="text-sm text-gray-500">Manage family members and invite codes</p>
                      </div>
                      <Link href="/family">
                        <Button variant="outline">Go to Family</Button>
                      </Link>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Family Items</p>
                        <p className="text-sm text-gray-500">View and manage household items</p>
                      </div>
                      <Link href="/items">
                        <Button variant="outline">View Items</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* App Information
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  About Home Inventory
                </CardTitle>
                <CardDescription>
                  Application information and support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Version</p>
                      <p className="text-gray-500">1.0.0</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Authentication</p>
                      <p className="text-gray-500">Clerk</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Database</p>
                      <p className="text-gray-500">MongoDB</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Framework</p>
                      <p className="text-gray-500">Next.js</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Home Inventory Tracker helps families organize and track household items
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card> */}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and navigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/items/add" className="w-full">
                    <Button variant="outline" className="w-full">
                      Add New Item
                    </Button>
                  </Link>
                  <Link href="/items/latest" className="w-full">
                    <Button variant="outline" className="w-full">
                      View Latest Items
                    </Button>
                  </Link>
                  <Link href="/items" className="w-full">
                    <Button variant="outline" className="w-full">
                      Search Items
                    </Button>
                  </Link>
                  <Link href="/family" className="w-full">
                    <Button variant="outline" className="w-full">
                      Family Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}