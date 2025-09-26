const { MongoClient } = require('mongodb');

async function testMongoDB() {
    const client = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');
    
    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB successfully');
        
        const db = client.db(process.env.DB_NAME || 'home_inventory_db');
        console.log(`✅ Connected to database: ${db.databaseName}`);
        
        // Test collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Collections:', collections.map(c => c.name));
        
        // Test basic operations
        const testCollection = db.collection('test');
        const result = await testCollection.insertOne({ test: true, timestamp: new Date() });
        console.log('✅ Test insert successful:', result.insertedId);
        
        await testCollection.deleteOne({ _id: result.insertedId });
        console.log('✅ Test delete successful');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
    } finally {
        await client.close();
        console.log('🔌 MongoDB connection closed');
    }
}

testMongoDB();