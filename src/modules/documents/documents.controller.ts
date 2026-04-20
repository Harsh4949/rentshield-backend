import { Request, Response } from 'express';
import { documentsService } from './documents.service';

export const documentsController = {
  async list(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { category, tenancyId, q } = req.query;
      const documents = await documentsService.listDocuments(userId, {
        category: category as any,
        tenancyId: tenancyId as string,
        q: q as string
      });
      res.json(documents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async upload(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { category, name, permission, fileUrl, fileType, fileSize, tenancyId, expiryDate } = req.body;
      
      const document = await documentsService.uploadDocument(userId, {
        category,
        name,
        fileUrl,
        fileType,
        fileSize: parseInt(fileSize),
        permission,
        tenancyId,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });
      
      res.status(201).json(document);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await documentsService.deleteDocument(userId, id);
      res.status(204).send();
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getExpiryAlerts(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const alerts = await documentsService.getExpiryAlerts(userId);
      res.json(alerts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async download(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const docs = await documentsService.listDocuments(userId, {});
      const doc = docs.find(d => d.id === id);
      
      if (!doc) {
        return res.status(404).json({ error: 'Document not found or access denied' });
      }
      
      // MOCK: In a real app, stream the file from S3/Azure
      res.redirect(doc.fileUrl);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};