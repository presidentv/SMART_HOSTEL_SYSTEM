import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// Get unread notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  try {
    await prisma.notification.updateMany({
      where: { id: Number(id), user_id: userId },
      data: { is_read: true }
    });
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
