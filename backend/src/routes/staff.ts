import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorizeRole } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// Get staff list (Admin/Student can see staff)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'STAFF' },
      include: { staffProfile: true },
      orderBy: { created_at: 'desc' },
    });
    return res.json(staff);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin manual assign request to staff
router.post('/assign', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { request_id, staff_id } = req.body;

  try {
    const existingAssignment = await prisma.assignment.findUnique({ where: { request_id: Number(request_id) } });
    if (existingAssignment) {
      await prisma.assignment.delete({ where: { request_id: Number(request_id) } });
    }

    const assignment = await prisma.assignment.create({
      data: {
        request_id: Number(request_id),
        staff_id: Number(staff_id),
      },
    });

    await prisma.request.update({
      where: { id: Number(request_id) },
      data: { status: 'ASSIGNED' },
    });

    return res.json({ message: 'Task assigned successfully', assignment });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
