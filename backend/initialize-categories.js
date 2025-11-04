// Script to initialize default categories in the database
const mongoose = require('mongoose');
const { Category } = require('./src/modules/social/models');
const config = require('./src/config');

async function initializeCategories() {
  try {
    console.log('[INFO] Connecting to MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('[INFO] Connected to MongoDB successfully');

    console.log('[INFO] Initializing default categories...');
    
    const defaultCategories = [
      {
        name: 'General',
        description: 'General discussions and topics',
        color: '#3B82F6',
        isDefault: true,
        tags: ['general', 'discussion', 'chat'],
        keywords: ['general', 'discussion', 'chat', 'talk'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000') // System user ID
      },
      {
        name: 'Technology',
        description: 'Technology news, discussions, and innovations',
        color: '#10B981',
        tags: ['tech', 'technology', 'innovation', 'software'],
        keywords: ['technology', 'tech', 'software', 'hardware', 'innovation', 'ai', 'programming'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000')
      },
      {
        name: 'Business',
        description: 'Business news, entrepreneurship, and finance',
        color: '#F59E0B',
        tags: ['business', 'finance', 'entrepreneurship', 'startup'],
        keywords: ['business', 'finance', 'entrepreneurship', 'startup', 'investment', 'economy'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000')
      },
      {
        name: 'Entertainment',
        description: 'Movies, music, games, and entertainment',
        color: '#EF4444',
        tags: ['entertainment', 'movies', 'music', 'games'],
        keywords: ['entertainment', 'movies', 'music', 'games', 'tv', 'celebrities', 'fun'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000')
      },
      {
        name: 'Sports',
        description: 'Sports news, discussions, and updates',
        color: '#8B5CF6',
        tags: ['sports', 'fitness', 'athletics', 'competition'],
        keywords: ['sports', 'fitness', 'athletics', 'football', 'basketball', 'soccer', 'olympics'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000')
      },
      {
        name: 'Science',
        description: 'Scientific discoveries, research, and education',
        color: '#06B6D4',
        tags: ['science', 'research', 'education', 'discovery'],
        keywords: ['science', 'research', 'education', 'discovery', 'physics', 'chemistry', 'biology'],
        createdBy: new mongoose.Types.ObjectId('000000000000000000000000')
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const categoryData of defaultCategories) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findOne({ name: categoryData.name });
        if (existingCategory) {
          console.log(`[WARN] Category '${categoryData.name}' already exists, skipping`);
          skippedCount++;
          continue;
        }

        // Create the category
        const category = new Category(categoryData);
        await category.save();
        console.log(`[SUCCESS] Created category: ${category.name}`);
        createdCount++;
      } catch (error) {
        console.error(`[ERROR] Failed to create category '${categoryData.name}':`, error.message);
      }
    }

    console.log(`[INFO] Category initialization complete:`);
    console.log(`[INFO]   Created: ${createdCount} categories`);
    console.log(`[INFO]   Skipped: ${skippedCount} categories`);
    console.log(`[INFO]   Total: ${createdCount + skippedCount} categories processed`);

  } catch (error) {
    console.error('[ERROR] Failed to initialize categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('[INFO] Disconnected from MongoDB');
  }
}

// Run the initialization
initializeCategories();
