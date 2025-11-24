const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');

// Helper: Ensure every record has createdAt (useful for old records)
function ensureCreatedAt(records) {
  let updated = false;
  records.forEach(r => {
    if (!r.createdAt) {
      r.createdAt = new Date().toISOString();
      updated = true;
    }
  });
  if (updated) fileDB.writeDB(records); // Save back only if modified
  return records;
}

function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  const data = fileDB.readDB();

  // Add createdAt timestamp
  const newRecord = {
    id: recordUtils.generateId(),
    name,
    value,
    createdAt: new Date().toISOString()
  };

  data.push(newRecord);
  fileDB.writeDB(data);

  vaultEvents.emit('recordAdded', newRecord);
  return newRecord;
}

function listRecords() {
  // Load + Fix old missing createdAt fields
  const data = fileDB.readDB();
  return ensureCreatedAt(data);
}

function updateRecord(id, newName, newValue) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  record.name = newName;
  record.value = newValue;

  // Ensure createdAt exists (edge case)
  if (!record.createdAt) {
    record.createdAt = new Date().toISOString();
  }

  fileDB.writeDB(data);
  vaultEvents.emit('recordUpdated', record);
  return record;
}

function deleteRecord(id) {
  let data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  data = data.filter(r => r.id !== id);
  fileDB.writeDB(data);

  vaultEvents.emit('recordDeleted', record);
  return record;
}

module.exports = { addRecord, listRecords, updateRecord, deleteRecord };
