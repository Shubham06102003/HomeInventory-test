'use client'

import { useState, useEffect } from 'react'
import LoadingScreen from '@/components/LoadingScreen'
import { useUser, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ConfirmDialog'
import AdminLeaveFamilyDropdown from '@/components/AdminLeaveFamilyDropdown'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Users, Plus, Copy, Home, Package, Search, Clock, Settings } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/ui/Header'
import AwaitingApproval from '@/components/AwaitingApproval'



export default function FamilyPage() {
  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', confirmText: 'Confirm', cancelText: 'Cancel', onConfirm: null });
  // Awaiting approval modal state
  const [showAwaiting, setShowAwaiting] = useState(false)
  const [pendingInviteId, setPendingInviteId] = useState(null)
  const handleRemoveMember = async (memberId) => {
    try {
      const response = await fetch('/api/family/members/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      })
      if (response.ok) {
        toast.success('Member removed!')
        fetchUserFamily()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }
  const { user } = useUser()
  const [family, setFamily] = useState(null)
  const [familyMembers, setFamilyMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [refreshingInvites, setRefreshingInvites] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserFamily()
    }
  }, [user])

  useEffect(() => {
    if (family && isAdmin()) {
      fetchPendingInvitations()
    }
  }, [family])
  const isAdmin = () => {
    return familyMembers.some(m => m.userId === user?.id && m.role === 'admin')
  }

  const fetchPendingInvitations = async () => {
    setRefreshingInvites(true)
    try {
      const response = await fetch('/api/family/invitations')
      if (response.ok) {
        const data = await response.json()
        setPendingInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
    setRefreshingInvites(false)
  }
  const handleAcceptInvitation = async (invitationId) => {
    try {
      const response = await fetch('/api/family/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId })
      })
      if (response.ok) {
        toast.success('Invitation accepted!')
        fetchUserFamily()
        fetchPendingInvitations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to accept invitation')
      }
    } catch (error) {
      toast.error('Failed to accept invitation')
    }
  }

  const handleRejectInvitation = async (invitationId) => {
    try {
      const response = await fetch('/api/family/invitations/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId })
      })
      if (response.ok) {
        toast.success('Invitation rejected!')
        fetchPendingInvitations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject invitation')
      }
    } catch (error) {
      toast.error('Failed to reject invitation')
    }
  }

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
    if (family) {
      toast.error('You are already a member of a family!')
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
        if (data.invitation) {
          setPendingInviteId(data.invitation.id)
          setShowAwaiting(true)
          setInviteCode('')
        } else {
          setFamily(data.family)
          setFamilyMembers(data.members)
          setInviteCode('')
          toast.success('Joined family successfully!')
        }
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

  const [inviteCodeVisible, setInviteCodeVisible] = useState(false);
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
        <ConfirmDialog
          open={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        />
        {showAwaiting && pendingInviteId && (
          <AwaitingApproval
            invitationId={pendingInviteId}
            onAccepted={() => {
              setShowAwaiting(false);
              setPendingInviteId(null);
              fetchUserFamily();
              toast.success('Your request was accepted!');
            }}
            onRejected={() => {
              setShowAwaiting(false);
              setPendingInviteId(null);
              toast.error('Your request was rejected by the admin.');
            }}
          />
        )}
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
                  {/* <Badge variant="secondary" className="font-mono">
                    {family.inviteCode}
                  </Badge> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Invite Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono select-none">
                        {inviteCodeVisible ? family.inviteCode : '*'.repeat(family.inviteCode.length)}
                      </code>
                      <Button
                        onClick={() => setInviteCodeVisible(v => !v)}
                        size="sm"
                        variant="ghost"
                        aria-label={inviteCodeVisible ? 'Hide invite code' : 'Show invite code'}
                        className="px-2"
                      >
                        {inviteCodeVisible ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.442-4.362M6.634 6.634A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.96 9.96 0 01-4.284 5.255M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                        )}
                      </Button>
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

            {/* Pending Invitations (Admin only) */}
            {isAdmin() && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    {refreshingInvites ? 'Loading...' : `${pendingInvitations.length} pending`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingInvitations.length === 0 && <p className="text-gray-500">No pending invitations.</p>}
                    {pendingInvitations.map((invite) => (
                      <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-medium">
                            {invite.userName?.charAt(0)?.toUpperCase() || invite.userEmail?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">{invite.userName || invite.userEmail}</p>
                            <p className="text-sm text-gray-500">{invite.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          <Button size="sm" variant="default" onClick={() => handleAcceptInvitation(invite.id)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectInvitation(invite.id)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Members */}
            <Card>
              <CardHeader>
                <CardTitle>Family Members</CardTitle>
                <CardDescription>{familyMembers.length} member{familyMembers.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...familyMembers].sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return 0;
                  }).map((member) => (
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
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={member.role === 'admin' ? 'default' : 'secondary'}
                          className="w-fit sm:w-auto mt-2 sm:mt-0"
                        >
                          {member.role}
                        </Badge>
                        {/* Remove button for admin, not for self */}
                        {isAdmin() && member.role !== 'admin' && (
                          <Button size="sm" variant="destructive" onClick={() => {
                            setConfirmState({
                              open: true,
                              title: 'Remove Member',
                              message: 'Are you sure you want to remove this member from the family?',
                              confirmText: 'Remove',
                              cancelText: 'Cancel',
                              onConfirm: async () => {
                                setConfirmState((prev) => ({ ...prev, open: false }));
                                try {
                                  const response = await fetch('/api/family/members/remove', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ memberId: member.id })
                                  });
                                  if (response.ok) {
                                    toast.success('Member removed!');
                                    fetchUserFamily();
                                  } else {
                                    const error = await response.json();
                                    toast.error(error.error || 'Failed to remove member');
                                  }
                                } catch (error) {
                                  toast.error('Failed to remove member');
                                }
                              }
                            });
                          }}>
                            Remove
                          </Button>
                        )}
                        {/* Leave Family button for self (non-admin) */}
                        {member.userId === user?.id && member.role !== 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setConfirmState({
                              open: true,
                              title: 'Leave Family',
                              message: 'Are you sure you want to leave the family?',
                              confirmText: 'Leave',
                              cancelText: 'Cancel',
                              onConfirm: async () => {
                                setConfirmState((prev) => ({ ...prev, open: false }));
                                try {
                                  const response = await fetch('/api/family/members/leave', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                  });
                                  if (response.ok) {
                                    toast.success('You have left the family.');
                                    setFamily(null);
                                    setFamilyMembers([]);
                                  } else {
                                    const error = await response.json();
                                    toast.error(error.error || 'Failed to leave family');
                                  }
                                } catch (error) {
                                  toast.error('Failed to leave family');
                                }
                              }
                            });
                          }}>
                            Leave Family
                          </Button>
                        )}
                        {/* Leave Family button for admin (with transfer) */}
                        {member.userId === user?.id && member.role === 'admin' && familyMembers.filter(m => m.role !== 'admin').length > 0 && (
                          <AdminLeaveFamilyDropdown
                            members={familyMembers.filter(m => m.role !== 'admin')}
                            onTransfer={async (newAdminId) => {
                              setConfirmState({
                                open: true,
                                title: 'Transfer Admin & Leave',
                                message: 'Are you sure you want to transfer admin role and leave the family?',
                                confirmText: 'Transfer & Leave',
                                cancelText: 'Cancel',
                                onConfirm: async () => {
                                  setConfirmState((prev) => ({ ...prev, open: false }));
                                  try {
                                    const response = await fetch('/api/family/members/transfer-admin-and-leave', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ newAdminId })
                                    });
                                    if (response.ok) {
                                      toast.success('Admin role transferred and you have left the family.');
                                      setFamily(null);
                                      setFamilyMembers([]);
                                    } else {
                                      const error = await response.json();
                                      toast.error(error.error || 'Failed to leave family');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to leave family');
                                  }
                                }
                              });
                            }}
                          />
                        )}
                        {/* Leave and Delete Family button for single admin with no members */}
                        {member.userId === user?.id && member.role === 'admin' && familyMembers.length === 1 && (
                          <Button size="sm" variant="destructive" onClick={() => {
                            setConfirmState({
                              open: true,
                              title: 'Delete Family',
                              message: 'Are you sure you want to delete the family? This action cannot be undone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              onConfirm: async () => {
                                setConfirmState((prev) => ({ ...prev, open: false }));
                                try {
                                  const response = await fetch('/api/family/delete-and-leave', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                  });
                                  if (response.ok) {
                                    toast.success('Family deleted and you have left.');
                                    setFamily(null);
                                    setFamilyMembers([]);
                                  } else {
                                    const error = await response.json();
                                    toast.error(error.error || 'Failed to delete family');
                                  }
                                } catch (error) {
                                  toast.error('Failed to delete family');
                                }
                              }
                            });
                          }}>
                            Leave & Delete Family
                          </Button>
                        )}
                      </div>
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