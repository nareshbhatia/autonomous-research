import { rootRouter } from './root-router';
import { vehiclesRouter } from './vehicles-router';
import { Router } from 'express';

export const router = Router();
router.use('/', rootRouter);
router.use('/api/vehicles', vehiclesRouter);
