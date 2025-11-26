import { database } from '../shared/database/connection';
import reindexService from '../services/search/reindex.service';
import { elasticsearchService } from '../services/search';

async function main() {
  if (!elasticsearchService.isEnabled()) {
    console.error('Elasticsearch is not enabled. Please set ELASTICSEARCH_NODE in your .env');
    process.exit(1);
  }

  try {
    await database.connect();
    await import('../models/users/User');
    await import('../models/Category');
    await import('../models/Product');
    await import('../models/Post');

    await elasticsearchService.initialize();

    console.log('Reindex check — running conditional reindex where ES missing documents');
    await reindexService.reindexIfNeeded();

    console.log('Reindex check complete');
    process.exit(0);
  } catch (err) {
    console.error('Reindex failed:', err);
    process.exit(1);
  }
}

main();
