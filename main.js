require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const db = require('./db/mongo'); // Using MongoDB DB
require('./events/logger');

// ----- Initialize Readline -----
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ----- Start App & Connect DB -----
async function startApp() {
  await db.connectDB(process.env.MONGO_URI);
  menu();
}

function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit
=====================
  `);

  rl.question('Choose option: ', async ans => {
    switch (ans.trim()) {

      // ------------------ ADD RECORD ------------------
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', async value => {
            await db.addRecord({ name, value });
            console.log('✅ Record added successfully!');
            menu();
          });
        });
        break;

      // ------------------ LIST RECORDS ------------------
      case '2':
        const allList = await db.listRecords();
        if (allList.length === 0) console.log('No records found.');
        else
          allList.forEach(r =>
            console.log(`ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt}`)
          );
        menu();
        break;

      // ------------------ UPDATE RECORD ------------------
      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', async value => {
              const updated = await db.updateRecord(id.trim(), name, value);
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              menu();
            });
          });
        });
        break;

      // ------------------ DELETE RECORD ------------------
      case '4':
        rl.question('Enter record ID to delete: ', async id => {
          const deleted = await db.deleteRecord(id.trim());
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          menu();
        });
        break;

      // ------------------ SEARCH RECORDS ------------------
      case '5':
        rl.question('Enter search keyword (ID or Name): ', async keyword => {
          const all = await db.listRecords();
          const term = keyword.toLowerCase();

          const matches = all.filter(r =>
            r.name.toLowerCase().includes(term) ||
            r._id.toString() === term
          );

          if (matches.length === 0) {
            console.log('❌ No records found.');
          } else {
            console.log(`\nFound ${matches.length} matching record(s):`);
            matches.forEach((r, i) =>
              console.log(`${i + 1}. ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt}`)
            );
          }

          menu();
        });
        break;

      // ------------------ SORT RECORDS ------------------
      case '6':
        const allRecords = await db.listRecords();
        if (allRecords.length === 0) {
          console.log("No records to sort.");
          return menu();
        }

        console.log(`
Choose field to sort by:
1. Name
2. Creation Date
        `);

        rl.question("Choose option: ", sortField => {
          console.log(`
Choose order:
1. Ascending
2. Descending
          `);

          rl.question("Choose order: ", async sortOrder => {
            const asc = sortOrder.trim() === "1";
            let sorted = [...allRecords];

            if (sortField.trim() === "1") {
              sorted.sort((a, b) =>
                asc
                  ? a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                  : b.name.toLowerCase().localeCompare(a.name.toLowerCase())
              );
            }

            else if (sortField.trim() === "2") {
              sorted.sort((a, b) =>
                asc
                  ? new Date(a.createdAt) - new Date(b.createdAt)
                  : new Date(b.createdAt) - new Date(a.createdAt)
              );
            }

            console.log("\nSorted Records:");
            sorted.forEach(r =>
              console.log(`ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${r.createdAt}`)
            );

            menu();
          });
        });
        break;

      // ------------------ EXPORT DATA ------------------
      case '7':
        const exportRecords = await db.listRecords();
        const exportPath = path.join(__dirname, 'export.txt');

        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').split('.')[0];

        let content = '';
        content += '===== Vault Export =====\n';
        content += `Exported At: ${timestamp}\n`;
        content += `Total Records: ${exportRecords.length}\n`;
        content += `File Name: export.txt\n`;
        content += '-----------------------------\n\n';

        exportRecords.forEach(r => {
          content += `ID: ${r._id}\n`;
          content += `Name: ${r.name}\n`;
          content += `Value: ${r.value}\n`;
          content += `Created At: ${r.createdAt}\n\n`;
        });

        fs.writeFileSync(exportPath, content);
        console.log(`📤 Data exported successfully to export.txt`);
        menu();
        break;

      // ------------------ VIEW VAULT STATISTICS ------------------
      case '8': {
        const total = await db.countRecords();
        const { earliest, latest } = await db.getEarliestAndLatest();
        const lastModified = await db.getLastModified();
        const allStats = await db.listRecords();

        const longest = allStats.reduce((a, b) =>
          a.name.length > b.name.length ? a : b
        );

        console.log(`
Vault Statistics:
--------------------------
Total Records: ${total}
Last Modified: ${lastModified ? new Date(lastModified).toISOString().replace('T', ' ').split('.')[0] : 'N/A'}
Longest Name: ${longest.name} (${longest.name.length} characters)
Earliest Record: ${earliest ? new Date(earliest.createdAt).toISOString().split('T')[0] : 'N/A'}
Latest Record: ${latest ? new Date(latest.createdAt).toISOString().split('T')[0] : 'N/A'}
        `);

        menu();
        break;
      }

      // ------------------ EXIT ------------------
      case '9':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

startApp();
