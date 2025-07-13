
// seed-firestore.js
const admin = require('firebase-admin');
const fs = require('fs');

// --- IMPORTANT: Configuration ---
// 1. Download your Firebase Admin SDK service account key JSON file
//    from Firebase Console: Project settings > Service accounts > Generate new private key
// 2. Save it in the same directory as this script (e.g., as 'serviceAccountKey.json')
// 3. Update the path below if your file name is different.
const serviceAccount = require('./serviceAccountKey.json'); // <--- YOUR SERVICE ACCOUNT KEY

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Data Files ---
const versesDataPath = './verses.json';
const challengesDataPath = './challenges.json';
const exclusiveContentDataPath = './exclusive_content.json';
const readingPlansDataPath = './reading_plans.json';
const quizzesDataPath = './quizzes.json';
const quizCategoriesDataPath = './quiz_categories.json';
const missionsDataPath = './missions.json';


async function seedCollection(collectionName, dataFilePath) {
  try {
    const rawData = fs.readFileSync(dataFilePath);
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      console.error(`Error: Data in ${dataFilePath} is not an array.`);
      return;
    }

    console.log(`Starting to seed collection: ${collectionName}`);
    const collectionRef = db.collection(collectionName);
    let batch = db.batch(); // Initialize batch here

    let count = 0;
    let writeCountInBatch = 0; // Keep track of writes in current batch

    for (const item of data) {
      if (!item.id) {
        console.warn(`Skipping item in ${dataFilePath} due to missing 'id' field:`, item);
        continue;
      }
      // Use the item's 'id' field as the Firestore document ID
      const docRef = collectionRef.doc(item.id);
      batch.set(docRef, item);
      count++;
      writeCountInBatch++;

      if (writeCountInBatch >= 400) { // Firestore batch limit is 500 writes, use a slightly lower number for safety
        console.log(`Committing batch of ${writeCountInBatch} items for ${collectionName}...`);
        await batch.commit();
        batch = db.batch(); // Start a new batch
        writeCountInBatch = 0; // Reset batch write count
      }
    }

    if (writeCountInBatch > 0) { // Commit any remaining items
      console.log(`Committing final batch of ${writeCountInBatch} items for ${collectionName}...`);
      await batch.commit();
    }

    console.log(`Successfully seeded ${count} documents into ${collectionName} collection.`);
  } catch (error) {
    console.error(`Error seeding ${collectionName}:`, error);
  }
}

async function main() {
  console.log('Starting Firestore seeding process...');

  await seedCollection('bible_verses', versesDataPath);
  await seedCollection('challenges_meta', challengesDataPath);
  await seedCollection('exclusive_content_meta', exclusiveContentDataPath);
  await seedCollection('readingPlans', readingPlansDataPath);
  await seedCollection('quizzes', quizzesDataPath);
  await seedCollection('quiz_categories', quizCategoriesDataPath);
  await seedCollection('missions', missionsDataPath);

  console.log('Firestore seeding process finished.');
  // The script will exit automatically once all promises resolve.
}

main().catch(error => {
  console.error("Unhandled error in main seeding function:", error);
  process.exit(1); // Exit with an error code
});
