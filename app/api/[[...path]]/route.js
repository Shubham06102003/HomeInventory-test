import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Generate human-readable invite code
function generateInviteCode() {
  const adjectives = ['SUNNY', 'HAPPY', 'BRIGHT', 'COZY', 'WARM', 'FRESH', 'COOL', 'SMART', 'SWIFT', 'CALM']
  const nouns = ['HOUSE', 'HOME', 'PLACE', 'SPACE', 'ROOM', 'SPOT', 'ZONE', 'NEST', 'HUB', 'BASE']
  const year = new Date().getFullYear()
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  
  return `${adjective}-${noun}-${suffix}`
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  // Admin leaves and deletes family if only member
  if (route === '/family/delete-and-leave' && method === 'POST') {
    const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' });
    if (!adminMembership) {
      return handleCORS(NextResponse.json({ error: 'You are not the admin' }, { status: 403 }));
    }
    const memberCount = await db.collection('family_members').countDocuments({ familyId: adminMembership.familyId });
    if (memberCount > 1) {
      return handleCORS(NextResponse.json({ error: 'Family has other members. Cannot delete.' }, { status: 400 }));
    }
    await db.collection('family_members').deleteOne({ id: adminMembership.id });
    await db.collection('families').deleteOne({ id: adminMembership.familyId });
    return handleCORS(NextResponse.json({ success: true }));
  }

  // Always initialize db and userId first
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;
  const db = await connectToMongo();
  const { userId } = auth();


  // Admin transfers role and leaves family
  if (route === '/family/members/transfer-admin-and-leave' && method === 'POST') {
    const body = await request.json();
    const { newAdminId } = body;
    const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' });
    if (!adminMembership) {
      return handleCORS(NextResponse.json({ error: 'You are not the admin' }, { status: 403 }));
    }
    // Check new admin is a member of the same family and not already admin
    const newAdmin = await db.collection('family_members').findOne({ id: newAdminId, familyId: adminMembership.familyId });
    if (!newAdmin || newAdmin.role === 'admin') {
      return handleCORS(NextResponse.json({ error: 'Invalid new admin selection' }, { status: 400 }));
    }
    // Update new admin's role
    await db.collection('family_members').updateOne({ id: newAdminId }, { $set: { role: 'admin' } });
    // Remove current admin
    await db.collection('family_members').deleteOne({ id: adminMembership.id });
    return handleCORS(NextResponse.json({ success: true }));
  }
  

  // Member leaves family
  if (route === '/family/members/leave' && method === 'POST') {
    const membership = await db.collection('family_members').findOne({ userId });
    if (!membership) {
      return handleCORS(NextResponse.json({ error: 'You are not a member of any family' }, { status: 400 }));
    }
    // Prevent admin from leaving (optional: you can allow if you want to transfer admin)
    if (membership.role === 'admin') {
      return handleCORS(NextResponse.json({ error: 'Admin cannot leave the family directly' }, { status: 400 }));
    }
    const result = await db.collection('family_members').deleteOne({ id: membership.id });
    if (result.deletedCount === 1) {
      return handleCORS(NextResponse.json({ success: true }));
    } else {
      return handleCORS(NextResponse.json({ error: 'Failed to leave family' }, { status: 500 }));
    }
  }

  // Admin: remove a family member
  if (route === '/family/members/remove' && method === 'POST') {
    const body = await request.json()
    const { memberId } = body
    if (!memberId) {
      return handleCORS(NextResponse.json({ error: 'Member ID required' }, { status: 400 }))
    }
    // Find admin membership
    const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' })
    if (!adminMembership) {
      return handleCORS(NextResponse.json({ error: 'Only family admin can remove members' }, { status: 403 }))
    }
    // Prevent admin from removing themselves
    if (adminMembership.id === memberId) {
      return handleCORS(NextResponse.json({ error: 'Admin cannot remove themselves' }, { status: 400 }))
    }
    // Remove member
    const result = await db.collection('family_members').deleteOne({ id: memberId, familyId: adminMembership.familyId })
    if (result.deletedCount === 1) {
      return handleCORS(NextResponse.json({ success: true }))
    } else {
      return handleCORS(NextResponse.json({ error: 'Member not found or not removed' }, { status: 404 }))
    }
  }

  // Batch fetch family and items together
  if (route === '/family-with-items' && method === 'GET') {
    if (!userId) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 }))
    }
    const membership = await db.collection('family_members').findOne({ userId })
    if (!membership) {
      return handleCORS(NextResponse.json({ family: null, items: [] }))
    }
    const family = await db.collection('families').findOne({ id: membership.familyId })
    if (!family) {
      return handleCORS(NextResponse.json({ family: null, items: [] }))
    }
    const items = await db.collection('items').find({ familyId: family.id }).sort({ createdAt: -1 }).toArray()
    return handleCORS(NextResponse.json({
      family: { ...family, _id: undefined },
      items: items.map(item => ({ ...item, _id: undefined }))
    }))
  }
  // Delete Item Route
  if (route.startsWith('/items/delete/') && method === 'DELETE') {
    const itemId = path[2]
    const familyId = request.headers.get('x-family-id')
    if (!itemId || !familyId) {
      return handleCORS(NextResponse.json({ error: 'Item ID and family ID required' }, { status: 400 }))
    }
    // Verify user is member of the family
    const membership = await db.collection('family_members').findOne({ familyId, userId })
    if (!membership) {
      return handleCORS(NextResponse.json({ error: 'You are not a member of this family' }, { status: 403 }))
    }
    const result = await db.collection('items').deleteOne({ id: itemId, familyId })
    if (result.deletedCount === 1) {
      return handleCORS(NextResponse.json({ success: true }))
    } else {
      return handleCORS(NextResponse.json({ error: 'Item not found or not deleted' }, { status: 404 }))
    }
  }

  try {
    const db = await connectToMongo()
    const { userId } = auth()
    console.log('Clerk userId:', userId)
    // Store user in 'users' collection if not exists
    if (userId) {
      const userObj = await currentUser()
      if (userObj) {
        await db.collection('users').updateOne(
          { userId },
          {
            $set: {
              userId,
              fullName: userObj.fullName || '',
              firstName: userObj.firstName || '',
              lastName: userObj.lastName || '',
              email: userObj.emailAddresses?.[0]?.emailAddress || '',
              createdAt: userObj.createdAt ? new Date(userObj.createdAt) : new Date()
            }
          },
          { upsert: true }
        )
      }
    }

    // Public routes (no auth required)
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Home Inventory API" }))
    }

    // Protected routes - require authentication
    if (!userId) {
      return handleCORS(NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      ))
    }

    const user = await currentUser()

    // Family Routes
    if (route === '/family/create' && method === 'POST') {
      const body = await request.json()
      const { name } = body

      if (!name?.trim()) {
        return handleCORS(NextResponse.json(
          { error: 'Family name is required' }, 
          { status: 400 }
        ))
      }

      // Create family
      const family = {
        id: uuidv4(),
        name: name.trim(),
        createdBy: userId,
        inviteCode: generateInviteCode(),
        createdAt: new Date()
      }

      await db.collection('families').insertOne(family)

      // Add creator as admin member
      const member = {
        id: uuidv4(),
        familyId: family.id,
        userId: userId,
        userName: user?.fullName || user?.firstName || '',
        userEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        role: 'admin',
        joinedAt: new Date()
      }

      await db.collection('family_members').insertOne(member)

      return handleCORS(NextResponse.json({ 
        family: { ...family, _id: undefined }, 
        member: { ...member, _id: undefined } 
      }))
    }

    // User requests to join family (creates invitation)
    if (route === '/family/join' && method === 'POST') {
      const body = await request.json()
      const { inviteCode } = body

      if (!inviteCode?.trim()) {
        return handleCORS(NextResponse.json(
          { error: 'Invite code is required' }, 
          { status: 400 }
        ))
      }

      // Find family by invite code
      const family = await db.collection('families').findOne({ 
        inviteCode: inviteCode.trim().toUpperCase() 
      })

      if (!family) {
        return handleCORS(NextResponse.json(
          { error: 'Invalid invite code' }, 
          { status: 404 }
        ))
      }

      // Check if user is already a member
      const existingMember = await db.collection('family_members').findOne({
        familyId: family.id,
        userId: userId
      })

      if (existingMember) {
        return handleCORS(NextResponse.json(
          { error: 'You are already a member of this family' }, 
          { status: 400 }
        ))
      }

      // Check if invitation already exists
      const existingInvitation = await db.collection('family_invitations').findOne({
        familyId: family.id,
        userId: userId,
        status: 'pending'
      })
      if (existingInvitation) {
        return handleCORS(NextResponse.json(
          { error: 'You already have a pending invitation for this family' }, 
          { status: 400 }
        ))
      }

      // Create invitation
      const invitation = {
        id: uuidv4(),
        familyId: family.id,
        userId: userId,
        userName: user?.fullName || user?.firstName || '',
        userEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        status: 'pending',
        requestedAt: new Date()
      }
      await db.collection('family_invitations').insertOne(invitation)

      return handleCORS(NextResponse.json({ success: true, invitation }))
    }

    // Admin: list pending invitations for their family
    if (route === '/family/invitations' && method === 'GET') {
      // Find admin membership
      const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' })
      if (!adminMembership) {
        return handleCORS(NextResponse.json({ error: 'Only family admin can view invitations' }, { status: 403 }))
      }
      const invitations = await db.collection('family_invitations').find({ familyId: adminMembership.familyId, status: 'pending' }).toArray()
      return handleCORS(NextResponse.json({ invitations: invitations.map(i => ({ ...i, _id: undefined })) }))
    }

    // GET /family/invitations/status?id=...
    if (route === '/family/invitations/status' && method === 'GET') {
      const url = new URL(request.url);
      const invitationId = url.searchParams.get('id');
      if (!invitationId) {
        return handleCORS(NextResponse.json({ error: 'Invitation ID required' }, { status: 400 }));
      }
      const invitation = await db.collection('family_invitations').findOne({ id: invitationId });
      if (!invitation) {
        return handleCORS(NextResponse.json({ error: 'Invitation not found' }, { status: 404 }));
      }
      return handleCORS(NextResponse.json({ status: invitation.status }));
    }

    // Admin: accept invitation
    if (route === '/family/invitations/accept' && method === 'POST') {
      const body = await request.json()
      const { invitationId } = body
      if (!invitationId) {
        return handleCORS(NextResponse.json({ error: 'Invitation ID required' }, { status: 400 }))
      }
      // Find admin membership
      const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' })
      if (!adminMembership) {
        return handleCORS(NextResponse.json({ error: 'Only family admin can accept invitations' }, { status: 403 }))
      }
      // Find invitation
      const invitation = await db.collection('family_invitations').findOne({ id: invitationId, familyId: adminMembership.familyId, status: 'pending' })
      if (!invitation) {
        return handleCORS(NextResponse.json({ error: 'Invitation not found or already handled' }, { status: 404 }))
      }
      // Add user as member
      const member = {
        id: uuidv4(),
        familyId: invitation.familyId,
        userId: invitation.userId,
        userName: invitation.userName,
        userEmail: invitation.userEmail,
        role: 'member',
        joinedAt: new Date()
      }
      await db.collection('family_members').insertOne(member)
      // Mark invitation as accepted
      await db.collection('family_invitations').updateOne({ id: invitationId }, { $set: { status: 'accepted', handledAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, member }))
    }

    // Admin: reject invitation
    if (route === '/family/invitations/reject' && method === 'POST') {
      const body = await request.json()
      const { invitationId } = body
      if (!invitationId) {
        return handleCORS(NextResponse.json({ error: 'Invitation ID required' }, { status: 400 }))
      }
      // Find admin membership
      const adminMembership = await db.collection('family_members').findOne({ userId, role: 'admin' })
      if (!adminMembership) {
        return handleCORS(NextResponse.json({ error: 'Only family admin can reject invitations' }, { status: 403 }))
      }
      // Find invitation
      const invitation = await db.collection('family_invitations').findOne({ id: invitationId, familyId: adminMembership.familyId, status: 'pending' })
      if (!invitation) {
        return handleCORS(NextResponse.json({ error: 'Invitation not found or already handled' }, { status: 404 }))
      }
      // Mark invitation as rejected
      await db.collection('family_invitations').updateOne({ id: invitationId }, { $set: { status: 'rejected', handledAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true }))
    }

    if (route === '/family/user' && method === 'GET') {
      // Get user's family membership
      const membership = await db.collection('family_members').findOne({ userId })

      if (!membership) {
        return handleCORS(NextResponse.json({ family: null, members: [] }))
      }

      // Get family details
      const family = await db.collection('families').findOne({ 
        id: membership.familyId 
      })

      if (!family) {
        return handleCORS(NextResponse.json({ family: null, members: [] }))
      }

      // Get all family members
      const members = await db.collection('family_members')
        .find({ familyId: family.id })
        .toArray()

      return handleCORS(NextResponse.json({ 
        family: { ...family, _id: undefined }, 
        members: members.map(m => ({ ...m, _id: undefined }))
      }))
    }

    // Item Routes
    if (route.startsWith('/items/edit/') && method === 'PUT') {
      const itemId = path[2]
      const body = await request.json()
      const { name, description, itemImageUrl, placeImageUrl, itemImageBase64, placeImageBase64, tags, location, familyId } = body

      if (!itemId || !name?.trim() || !familyId) {
        return handleCORS(NextResponse.json(
          { error: 'Item ID, name, and family ID are required' },
          { status: 400 }
        ))
      }

      // Verify user is member of the family
      const membership = await db.collection('family_members').findOne({
        familyId,
        userId
      })

      if (!membership) {
        return handleCORS(NextResponse.json(
          { error: 'You are not a member of this family' },
          { status: 403 }
        ))
      }

      // Update item
      const updateResult = await db.collection('items').updateOne(
        { id: itemId, familyId },
        {
          $set: {
            name: name.trim(),
            description: description?.trim() || '',
            itemImageUrl: itemImageUrl || '',
            placeImageUrl: placeImageUrl || '',
            itemImageBase64: itemImageBase64 || '',
            placeImageBase64: placeImageBase64 || '',
            tags: tags?.trim() || '',
            location: location?.trim() || ''
          }
        }
      )

      if (updateResult.matchedCount === 0) {
        return handleCORS(NextResponse.json(
          { error: 'Item not found or you do not have permission to edit' },
          { status: 404 }
        ))
      }

      const updatedItem = await db.collection('items').findOne({ id: itemId, familyId })

      return handleCORS(NextResponse.json({ item: { ...updatedItem, _id: undefined } }))
    }
    if (route === '/items/add' && method === 'POST') {
      const body = await request.json()
      const { name, description, itemImageUrl, placeImageUrl, tags, location, familyId } = body

      if (!name?.trim() || !familyId) {
        return handleCORS(NextResponse.json(
          { error: 'Name and family ID are required' }, 
          { status: 400 }
        ))
      }

      // Verify user is member of the family
      const membership = await db.collection('family_members').findOne({
        familyId,
        userId
      })

      if (!membership) {
        return handleCORS(NextResponse.json(
          { error: 'You are not a member of this family' }, 
          { status: 403 }
        ))
      }

      const item = {
        id: uuidv4(),
        familyId,
        addedBy: userId,
        addedByName: user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Unknown',
        name: name.trim(),
        description: description?.trim() || '',
        itemImageUrl: itemImageUrl || '',
        placeImageUrl: placeImageUrl || '',
        tags: tags?.trim() || '',
        location: location?.trim() || '',
        createdAt: new Date()
      }

      await db.collection('items').insertOne(item)

      return handleCORS(NextResponse.json({ 
        item: { ...item, _id: undefined } 
      }))
    }

    if (route.startsWith('/items/family/') && method === 'GET') {
      const familyId = path[2] // /items/family/{familyId}
      
      if (path[3] === 'latest') {
        // Get latest items
        const membership = await db.collection('family_members').findOne({
          familyId,
          userId
        })

        if (!membership) {
          return handleCORS(NextResponse.json(
            { error: 'You are not a member of this family' }, 
            { status: 403 }
          ))
        }

        const items = await db.collection('items')
          .find({ familyId })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray()

        return handleCORS(NextResponse.json({ 
          items: items.map(item => ({ ...item, _id: undefined }))
        }))
      } else {
        // Get all items for family
        const membership = await db.collection('family_members').findOne({
          familyId,
          userId
        })

        if (!membership) {
          return handleCORS(NextResponse.json(
            { error: 'You are not a member of this family' }, 
            { status: 403 }
          ))
        }

        const items = await db.collection('items')
          .find({ familyId })
          .sort({ createdAt: -1 })
          .toArray()

        return handleCORS(NextResponse.json({ 
          items: items.map(item => ({ ...item, _id: undefined }))
        }))
      }
    }


    // Fetch single item by id
    if (route === '/items/by-id' && method === 'GET') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (!id) {
        return handleCORS(NextResponse.json({ error: 'Item id is required' }, { status: 400 }))
      }
      // Find item by id
      const item = await db.collection('items').findOne({ id })
      if (!item) {
        return handleCORS(NextResponse.json({ item: null }, { status: 404 }))
      }
      return handleCORS(NextResponse.json({ item: { ...item, _id: undefined } }))
    }

    if (route === '/items/search' && method === 'GET') {
      const url = new URL(request.url)
      const query = url.searchParams.get('query') || ''
      const familyId = url.searchParams.get('familyId')

      if (!familyId) {
        return handleCORS(NextResponse.json(
          { error: 'Family ID is required' }, 
          { status: 400 }
        ))
      }

      // Verify user is member of the family
      const membership = await db.collection('family_members').findOne({
        familyId,
        userId
      })

      if (!membership) {
        return handleCORS(NextResponse.json(
          { error: 'You are not a member of this family' }, 
          { status: 403 }
        ))
      }

      let searchFilter = { familyId }

      if (query.trim()) {
        const searchRegex = new RegExp(query.trim(), 'i')
        searchFilter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { location: searchRegex },
          { addedByName: searchRegex }
        ]
      }

      const items = await db.collection('items')
        .find(searchFilter)
        .sort({ createdAt: -1 })
        .toArray()

      return handleCORS(NextResponse.json({ 
        items: items.map(item => ({ ...item, _id: undefined }))
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute