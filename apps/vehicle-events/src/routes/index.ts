import { locationUpdateRouter } from './location-update-router';
import { rootRouter } from './root-router';
import { Router } from 'express';

export const router = Router();
router.use('/', rootRouter);
router.use('/location-update', locationUpdateRouter);
