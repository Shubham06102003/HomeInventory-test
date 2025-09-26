'use client'

import { useState, useEffect } from 'react'
import LoadingScreen from '@/components/LoadingScreen'
import { useUser, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Users, Plus, Copy, Home, Package, Search, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/ui/Header'



export default function FamilyPage() {
  const { user } = useUser()
  const [family, setFamily] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserFamily()
    }
  }, [user])

  const fetchUserFamily = async () => {
    try {
      const response = await fetch('/api/family/user')
      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
        setFamilyMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching family:', error)
    }
    setLoading(false)
  }

  const createFamily = async () => {
    if (!newFamilyName.trim()) {
      toast.error('Please enter a family name')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/family/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFamilyName.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
        setFamilyMembers([data.member])
        setNewFamilyName('')
        toast.success('Family created successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create family')
      }
    } catch (error) {
      console.error('Error creating family:', error)
      toast.error('Failed to create family')
    }
    setCreating(false)
  }

  const joinFamily = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code')
      return
    }

    setJoining(true)
    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setFamily(data.family)
        setFamilyMembers(data.members)
        setInviteCode('')
        toast.success('Joined family successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to join family')
      }
    } catch (error) {
      console.error('Error joining family:', error)
      toast.error('Failed to join family')
    }
    setJoining(false)
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.inviteCode)
    toast.success('Invite code copied!')
  }

  if (loading) {
    return <LoadingScreen message="Loading your family..." />
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
        {family ? (
          <div className="space-y-8">
            {/* Family Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {family.name}
                    </CardTitle>
                    <CardDescription>
                      Your family inventory • {familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {family.inviteCode}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Invite Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">{family.inviteCode}</code>
                      <Button onClick={copyInviteCode} size="sm" variant="outline">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Share this code with family members to invite them</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your family inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/items/add">
                    <Button className="w-full h-20 flex-col gap-2">
                      <Plus className="h-5 w-5" />
                      Add Item
                    </Button>
                  </Link>
                  <Link href="/items">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      View Items
                    </Button>
                  </Link>
                  <Link href="/items/latest">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Clock className="h-5 w-5" />
                      Latest Items
                    </Button>
                  </Link>
                  <Link href="/items?search=true">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2">
                      <Search className="h-5 w-5" />
                      Search Items
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Family Members */}
            <Card>
              <CardHeader>
                <CardTitle>Family Members</CardTitle>
                <CardDescription>{familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {member.userName?.charAt(0)?.toUpperCase() || member.userEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{member.userName || member.userEmail}</p>
                          <p className="text-sm text-gray-500">{member.userEmail}</p>
                        </div>
                      </div>
                      <Badge
                        variant={member.role === 'admin' ? 'default' : 'secondary'}
                        className="w-fit sm:w-auto mt-2 sm:mt-0"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Home Inventory!</h2>
              <p className="text-gray-600">Create a new family or join an existing one to start tracking your items</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Create Family */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Family</CardTitle>
                  <CardDescription>Start fresh with a new family inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="familyName">Family Name</Label>
                      <Input
                        id="familyName"
                        placeholder="e.g., The Smiths"
                        value={newFamilyName}
                        onChange={(e) => setNewFamilyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createFamily()}
                      />
                    </div>
                    <Button onClick={createFamily} disabled={creating} className="w-full">
                      {creating ? 'Creating...' : 'Create Family'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Join Family */}
              <Card>
                <CardHeader>
                  <CardTitle>Join Existing Family</CardTitle>
                  <CardDescription>Enter an invite code to join a family</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        placeholder="e.g., SUNNY-HOUSE-2024"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && joinFamily()}
                      />
                    </div>
                    <Button onClick={joinFamily} disabled={joining} className="w-full" variant="outline">
                      {joining ? 'Joining...' : 'Join Family'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}