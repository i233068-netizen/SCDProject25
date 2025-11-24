// db/mongo.js
const mongoose = require('mongoose');
const vaultEvents = require('../events');

// ----------------------
// CONNECT TO MONGODB
// ----------------------
async function connectDB(uri) {
  try {
    await mongoose.connect(uri); // Mongoose 7+ no options
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
}

// ----------------------
// SCHEMA + MODEL (with timestamps)
// ----------------------
const recordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true }
}, { timestamps: true }); // adds createdAt and updatedAt automatically

const Record = mongoose.model('Record', recordSchema);

// ----------------------
// CRUD FUNCTIONS
// ----------------------
async function addRecord({ name, value }) {
  const record = await Record.create({ name, value });
  // emit event with the created record (useful for backups/logging)
  vaultEvents.emit('recordAdded', record);
  return record;
}

async function listRecords() {
  // return all records as plain objects (lean)
  return await Record.find().lean();
}

async function updateRecord(id, newName, newValue) {
  const updated = await Record.findByIdAndUpdate(
    id,
    { name: newName, value: newValue },
    { new: true }
  ).lean();
  if (updated) vaultEvents.emit('recordUpdated', updated);
  return updated;
}

async function deleteRecord(id) {
  const deleted = await Record.findByIdAndDelete(id);
  if (deleted) vaultEvents.emit('recordDeleted', deleted);
  return deleted;
}

// ----------------------
// Helper / aggregation utilities
// ----------------------
async function countRecords() {
  return await Record.countDocuments();
}

async function getEarliestAndLatest() {
  const earliest = await Record.findOne().sort({ createdAt: 1 }).lean();
  const latest = await Record.findOne().sort({ createdAt: -1 }).lean();
  return { earliest, latest };
}

async function getLastModified() {
  // use updatedAt from the most recently modified document
  const latestUpdated = await Record.findOne().sort({ updatedAt: -1 }).lean();
  return latestUpdated ? latestUpdated.updatedAt : null;
}

module.exports = {
  connectDB,
  addRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  countRecords,
  getEarliestAndLatest,
  getLastModified
};
