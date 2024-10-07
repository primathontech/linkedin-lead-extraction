import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017/linkedinLeadsDB'; // Ensure this is correct
let db;
export async function connectToDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('linkedinLeadsDB');
    // const collection = db.collection('LinkedInProfileModel');
    // const result = await collection.find().toArray();
    // console.log('Raw Result:', result);
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } 
  // finally {
  //   await client.close();
  // }
}
import { MongoClient } from 'mongodb';

// const uri = 'mongodb://localhost:27017'; // Ensure this is correct

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('linkedinLeadsDB');
    const collection = db.collection('LinkedInProfileModel');
    const result = await collection.find().toArray();
    console.log('Raw Result:', result);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}


export const getDb = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
};