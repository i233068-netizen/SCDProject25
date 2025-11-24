// events/logger.js
const fs = require('fs');
const path = require('path');
const vaultEvents = require('./index');
const mongoose = require('mongoose');

// backups dir
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

// helper timestamp
function getTimestamp() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${date}_${time}`;
}

// Create backup by querying MongoDB directly using mongoose model
async function createBackupFromMongo() {
  try {
    // get Mongoose model (should be registered in db/mongo.js)
    const Record = mongoose.model('Record');
    const docs = await Record.find().lean();

    const filename = `backup_${getTimestamp()}.json`;
    const filePath = path.join(backupDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
    console.log(`📦 Backup created: backups/${filename}`);
  } catch (err) {
    console.error('❌ Failed to create backup from MongoDB:', err.message || err);
  }
}

vaultEvents.on('recordAdded', record => {
  console.log(`[EVENT] Record added: ID ${record._id}, Name: ${record.name}`);
  // create backup asynchronously (no await necessary here)
  createBackupFromMongo();
});

vaultEvents.on('recordUpdated', record => {
  console.log(`[EVENT] Record updated: ID ${record._id}, Name: ${record.name}`);
  // you may optionally backup on update; spec didn't require it — skipping to avoid noise
});

vaultEvents.on('recordDeleted', record => {
  console.log(`[EVENT] Record deleted: ID ${record._id}, Name: ${record.name}`);
  createBackupFromMongo();
});
