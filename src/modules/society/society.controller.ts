import { Request, Response } from 'express';
import Joi from 'joi';
import { societyService } from './society.service';

const createSocietySchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
});

const addBuildingSchema = Joi.object({
  name: Joi.string().required(),
});

const ruleSchema = Joi.object({
  category: Joi.string().required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  order: Joi.number().integer().default(0),
});

const setRulesSchema = Joi.array().items(ruleSchema).required();

const emergencyContactSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().required(),
  description: Joi.string().optional(),
  buildingId: Joi.string().uuid().optional(),
});

export const societyController = {
  async listSocieties(req: Request, res: Response) {
    try {
      const societies = await societyService.listSocieties();
      res.json({ societies });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createSociety(req: Request, res: Response) {
    try {
      const { error, value } = createSocietySchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const society = await societyService.createSociety(value);
      res.status(201).json({ society });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async getSocietyDetails(req: Request, res: Response) {
    try {
      const society = await societyService.getSocietyDetails(req.params.id);
      if (!society) return res.status(404).json({ error: 'Society not found' });
      res.json({ society });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async addBuilding(req: Request, res: Response) {
    try {
      const { error, value } = addBuildingSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const building = await societyService.addBuilding(req.params.id, value.name);
      res.status(201).json({ building });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async setRules(req: Request, res: Response) {
    try {
      const { error, value } = setRulesSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      await societyService.setRules(req.params.id, value);
      res.json({ message: 'Society rules updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async addEmergencyContact(req: Request, res: Response) {
    try {
      const { error, value } = emergencyContactSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const contact = await societyService.addEmergencyContact({
        ...value,
        societyId: req.params.id
      });
      res.status(201).json({ contact });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listResidents(req: Request, res: Response) {
    try {
      const residents = await societyService.listResidents(req.params.id);
      res.json({ residents });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async listEvents(req: Request, res: Response) {
    try {
      const events = await societyService.listEvents(req.params.id);
      res.json({ events });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async createEvent(req: Request, res: Response) {
    try {
      const event = await societyService.createEvent(req.params.id, req.body);
      res.status(201).json({ event });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async listAmenities(req: Request, res: Response) {
    try {
      const amenities = await societyService.listAmenities(req.params.id);
      res.json({ amenities });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async bookAmenity(req: Request, res: Response) {
    try {
      const { amenityId, startTime, endTime } = req.body;
      const booking = await societyService.bookAmenity(
        req.user!.id,
        amenityId,
        new Date(startTime),
        new Date(endTime)
      );
      res.status(201).json({ booking });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
