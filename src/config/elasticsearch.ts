import { Client } from '@elastic/elasticsearch';
import { config } from './index';

export const elasticsearch = new Client({ node: config.elasticsearch.node });

elasticsearch.ping()
  .then(() => console.log('[Elasticsearch] Connected successfully'))
  .catch((err) => console.warn(`[Elasticsearch] Connection warning: ${err.message}`));



