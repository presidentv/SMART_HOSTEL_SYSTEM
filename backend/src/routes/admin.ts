import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorizeRole } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/dashboard', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // SLA tracking & Priority Escalation: pending/assigned > 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const breachableRequests = await prisma.request.findMany({
      where: {
        created_at: { lt: yesterday },
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
      },
    });

    for (const req of breachableRequests) {
      const levels = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      let newPriority = req.priority;
      const currentIndex = levels.indexOf(newPriority);
      if (currentIndex < levels.length - 1) {
        newPriority = levels[currentIndex + 1];
      }

      await prisma.request.update({
        where: { id: req.id },
        data: { 
          sla_breached: true,
          priority: newPriority
        },
      });
    }

    const slaBreachedCount = await prisma.request.count({ where: { sla_breached: true, status: { not: 'COMPLETED' } } });

    // Fetch staff workload including average ratings
    const rawStaffWorkload = await prisma.staffProfile.findMany({
      include: { 
        user: true, 
        assignments: { 
          include: { 
            request: { 
              include: { feedback: true } 
            } 
          } 
        } 
      },
    });

    const staffWorkload = rawStaffWorkload.map(staff => {
      const feedbacks = staff.assignments
        .map(a => a.request.feedback)
        .filter(f => f !== null && f !== undefined);
      
      const avgRating = feedbacks.length > 0 
        ? feedbacks.reduce((acc, f) => acc + (f?.rating || 0), 0) / feedbacks.length 
        : 0;

      return {
        ...staff,
        avg_rating: Number(avgRating.toFixed(1)),
        assignments: undefined // Remove large nested data for payload efficiency
      };
    });

    const totalRequests = await prisma.request.count();
    const pendingRequests = await prisma.request.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } });
    const inProgressRequests = await prisma.request.count({ where: { status: 'IN_PROGRESS' } });
    const completedRequests = await prisma.request.count({ where: { status: 'COMPLETED' } });
    const urgentRequests = await prisma.request.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } });

    const categoryStats = await prisma.request.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return res.json({
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      urgentRequests,
      slaBreached: slaBreachedCount,
      staffWorkload,
      categoryStats,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/analytics/rooms', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const roomStats = await prisma.request.groupBy({
      by: ['room'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });
    return res.json(roomStats);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/analytics/daily', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.request.findMany({ select: { created_at: true } });
    const dailyMap: Record<string, number> = {};
    requests.forEach(r => {
      const date = r.created_at.toISOString().split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    
    const dailyStats = Object.keys(dailyMap).sort().map(date => ({
      date,
      count: dailyMap[date]
    }));
    return res.json(dailyStats);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending staff approvals
router.get('/pending-staff', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const pendingStaff = await prisma.user.findMany({
      where: { role: 'STAFF', is_approved: false } as any,
      include: { staffProfile: true },
      orderBy: { created_at: 'desc' }
    });
    return res.json(pendingStaff);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve staff
router.put('/approve-staff/:id', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.user.update({
      where: { id: Number(id) },
      data: { is_approved: true } as any
    });
    const staffProfile = await prisma.staffProfile.findUnique({ where: { user_id: Number(id) } });
    if (staffProfile) {
      await prisma.staffProfile.update({
        where: { id: staffProfile.id },
        data: { is_available: true }
      });
      await prisma.notification.create({
        data: { user_id: Number(id), message: 'Your staff account has been approved by the Admin! You can now start receiving assignments.' }
      });
    }
    return res.json({ message: 'Staff approved successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject staff
router.delete('/reject-staff/:id', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    const u: any = user;
    if (!u || u.is_approved) return res.status(400).json({ message: 'Cannot reject this user' });
    
    await prisma.staffProfile.deleteMany({ where: { user_id: Number(id) } });
    await prisma.user.delete({ where: { id: Number(id) } });
    
    return res.json({ message: 'Staff application rejected seamlessly' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users
router.get('/users', authenticate, authorizeRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, is_approved: true, room_number: true, created_at: true
      } as any
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
