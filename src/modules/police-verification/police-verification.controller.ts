import { Request, Response, NextFunction } from 'express';
import { policeVerificationService } from './police-verification.service';

export const policeVerificationController = {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenancyId } = req.params;
      const status = await policeVerificationService.getStatusByTenancy(tenancyId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenancyId, aadhaarNumber } = req.body;
      const verification = await policeVerificationService.initiate(tenancyId, aadhaarNumber);
      res.json({ message: 'Verification initiated', verification });
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenancyId, otp } = req.body;
      const verification = await policeVerificationService.verifyOtp(tenancyId, otp);
      res.json({ message: 'OTP verified successfully', verification });
    } catch (error) {
      next(error);
    }
  },

  async completeVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenancyId } = req.params;
      const { reportUrl } = req.body;
      const verification = await policeVerificationService.markAsVerified(tenancyId, reportUrl);
      res.json({ message: 'Police verification completed', verification });
    } catch (error) {
      next(error);
    }
  },
};
