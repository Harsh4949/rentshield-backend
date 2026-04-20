import { elasticsearch } from '../../config/elasticsearch';

const ES_INDEX = 'properties';

export const searchService = {
  async searchProperties(query: string) {
    try {
      const { hits } = await elasticsearch.search({
        index: ES_INDEX,
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'description', 'address', 'city', 'state', 'postalCode'],
            fuzziness: 'AUTO',
          },
        },
      });

      return hits.hits.map((hit) => ({ id: hit._id, ...(hit._source as any) }));
    } catch (error) {
      console.warn(`[Elasticsearch] Search failed: ${(error as Error).message}`);
      return [];
    }
  },

};
