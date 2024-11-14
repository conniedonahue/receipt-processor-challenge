import express from 'express';
import { receiptController } from '../controllers/receiptController.js';


const router = express.Router();
router.use(express.json())

router.post('/process', receiptController.createId)
router.get('/:id/points')


export default router;