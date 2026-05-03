import { Router } from 'express';
import { policeVerificationController } from './police-verification.controller';
import { authenticateToken } from '../../shared/middleware/auth';

const router = Router();

router.get('/:tenancyId', authenticateToken, policeVerificationController.getStatus);
router.post('/initiate', authenticateToken, policeVerificationController.initiate);
router.post('/verify-otp', authenticateToken, policeVerificationController.verifyOtp);
router.patch('/:tenancyId/complete', authenticateToken, policeVerificationController.completeVerification);

export default router;
