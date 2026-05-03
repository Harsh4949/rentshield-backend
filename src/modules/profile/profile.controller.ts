import { Request, Response } from 'express';
import Joi from 'joi';
import { profileService } from './profile.service';

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(100).optional(),
  lastName: Joi.string().min(2).max(100).optional(),
  avatar: Joi.string().uri().allow(null, '').optional(),
  phoneNumber: Joi.string().allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  dateOfBirth: Joi.date().allow(null, '').optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const toggle2faSchema = Joi.object({
  enabled: Joi.boolean().required(),
});

export const profileController = {
  async getProfile(req: Request, res: Response) {
    try {
      const profile = await profileService.getProfile(req.user!.id);
      res.json({ profile });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      console.log('Update Profile Body:', req.body);
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const profile = await profileService.updateProfile(req.user!.id, value);
      res.json({ profile, message: 'Profile updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const result = await profileService.changePassword(
        req.user!.id,
        value.currentPassword,
        value.newPassword
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async toggle2fa(req: Request, res: Response) {
    try {
      const { error, value } = toggle2faSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const result = await profileService.toggle2fa(req.user!.id, value.enabled);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
};
