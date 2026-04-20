import { Request, Response } from 'express';
import { searchService } from './search.service';

export const searchController = {
  async query(req: Request, res: Response) {
    const query = String(req.query.q ?? '');
    if (!query.trim()) {
      return res.status(400).json({ error: 'query_required' });
    }

    const results = await searchService.searchProperties(query);
    res.json(results);
  },
};
