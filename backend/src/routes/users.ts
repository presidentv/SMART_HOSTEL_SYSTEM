import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        room_number: true,
        created_at: true,
        staffProfile: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, room_number } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, room_number }
    });
    return res.json({ 
      message: 'Profile updated successfully', 
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, room_number: updated.room_number } 
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;
