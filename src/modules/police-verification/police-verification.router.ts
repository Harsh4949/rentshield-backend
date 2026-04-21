import { Router } from 'express';
import { policeVerificationController } from './police-verification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/:tenancyId', authenticate, policeVerificationController.getStatus);
router.post('/initiate', authenticate, policeVerificationController.initiate);
router.post('/verify-otp', authenticate, policeVerificationController.verifyOtp);
router.patch('/:tenancyId/complete', authenticate, policeVerificationController.completeVerification);

export default router;
