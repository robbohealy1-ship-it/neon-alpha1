import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { type, asset, message, severity } = req.body;

    const alert = await prisma.alert.create({
      data: {
        userId: req.userId!,
        type,
        asset,
        message,
        severity: severity || 'info'
      }
    });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.update({
      where: { id },
      data: { read: true }
    });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.alert.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
