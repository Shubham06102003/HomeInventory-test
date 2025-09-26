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
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method
  // Always initialize db and userId first
  const db = await connectToMongo()
  const { userId } = auth()

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

      // Add user as member
      const member = {
        id: uuidv4(),
        familyId: family.id,
        userId: userId,
        userName: user?.fullName || user?.firstName || '',
        userEmail: user?.emailAddresses?.[0]?.emailAddress || '',
        role: 'member',
        joinedAt: new Date()
      }

      await db.collection('family_members').insertOne(member)

      // Get all family members
      const members = await db.collection('family_members')
        .find({ familyId: family.id })
        .toArray()

      return handleCORS(NextResponse.json({ 
        family: { ...family, _id: undefined }, 
        members: members.map(m => ({ ...m, _id: undefined }))
      }))
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
      const { name, description, itemImageBase64, placeImageBase64, tags, location, familyId } = body

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
      const { name, description, itemImageBase64, placeImageBase64, tags, location, familyId } = body

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
        itemImageBase64: itemImageBase64 || '',
        placeImageBase64: placeImageBase64 || '',
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