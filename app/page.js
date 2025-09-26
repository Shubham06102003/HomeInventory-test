'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Users, Package, Search, Plus, Shield } from 'lucide-react'

export default function HomePage() {
  const { isSignedIn } = useAuth()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Home Inventory</h1>
            </div>
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <Link href="/family">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Track Your Home Items
            <span className="block text-blue-600">With Your Family</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Never lose track of your belongings again. Share household inventory with family members, 
            add photos, and find anything instantly.
          </p>
          {!isSignedIn && (
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Free Today
              </Button>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Family Sharing</CardTitle>
              <CardDescription>
                Create or join families and share inventory access with all members
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Package className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Photo Inventory</CardTitle>
              <CardDescription>
                Add photos of items and their locations to never forget where things are
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Smart Search</CardTitle>
              <CardDescription>
                Search by name, description, tags, location, or who added the item
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Plus className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Easy Adding</CardTitle>
              <CardDescription>
                Quick form to add items with photos, descriptions, and locations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Secure Access</CardTitle>
              <CardDescription>
                Your family inventory is private and secure with modern authentication
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <Home className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>Organization</CardTitle>
              <CardDescription>
                Keep track of everything in your home with tags and categories
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        {!isSignedIn && (
          <Card className="bg-blue-600 text-white border-0">
            <CardContent className="text-center p-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Get Organized?</h3>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of families already using Home Inventory Tracker
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                    Create Account
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}