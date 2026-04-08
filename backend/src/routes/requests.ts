import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorizeRole } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for local image upload simulation
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

import { detectPriority } from '../utils/priority';

// Create a new request (Student)
router.post('/', authenticate, authorizeRole(['STUDENT']), upload.single('image'), async (req: AuthRequest, res: Response) => {
  const { room, category, description } = req.body;
  const userId = req.user!.id;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // 1. Initial Priority Detection
    let priority = detectPriority(category, description, room);

    // 2. Room-wise Escalation (Rule 3)
    // If multiple complaints for same room in last 2 hours, increase priority
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentRequestsFromRoom = await prisma.request.count({
      where: {
        room,
        created_at: { gte: twoHoursAgo },
        status: { not: 'CANCELLED' }
      }
    });

    if (recentRequestsFromRoom > 0 && priority !== 'URGENT') {
      const levels = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      const currentIndex = levels.indexOf(priority);
      priority = levels[currentIndex + 1];
    }

    const request = await prisma.request.create({
      data: {
        user_id: userId,
        room,
        category,
        priority,
        description,
        image_url: imageUrl,
        status: 'PENDING',
      },
    });

    // Smart Auto-Assignment Logic -> assign to staff with least tasks
    const availableStaff = await prisma.staffProfile.findFirst({
      where: { 
        is_available: true,
        specialization: category,
      },
      orderBy: { tasks_handled: 'asc' },
    });

    if (availableStaff) {
      await prisma.assignment.create({
        data: {
          request_id: request.id,
          staff_id: availableStaff.id,
        },
      });

      await prisma.request.update({
        where: { id: request.id },
        data: { status: 'ASSIGNED' },
      });

      await prisma.staffProfile.update({
        where: { id: availableStaff.id },
        data: { tasks_handled: { increment: 1 } },
      });

      await prisma.notification.create({
        data: { user_id: availableStaff.user_id, message: `New priority task assigned: ${category} at ${room}` }
      });
    }

    return res.status(201).json({ message: 'Request created successfully', request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// View requests
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  try {
    let requests;
    if (role === 'STUDENT') {
      requests = await prisma.request.findMany({
        where: { user_id: userId },
        include: { assignment: { include: { staff: { include: { user: true } } } }, feedback: true },
        orderBy: { created_at: 'desc' },
      });
    } else if (role === 'STAFF') {
      const staffProfile = await prisma.staffProfile.findUnique({ where: { user_id: userId } });
      if (!staffProfile) return res.status(404).json({ message: 'Staff profile not found' });

      requests = await prisma.request.findMany({
        where: { assignment: { staff_id: staffProfile.id } },
        include: { user: true, assignment: true },
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      });
    } else if (role === 'ADMIN') {
      requests = await prisma.request.findMany({
        include: { user: true, assignment: { include: { staff: { include: { user: true } } } } },
        orderBy: { created_at: 'desc' },
      });
    }

    return res.json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update request status (Staff only)
router.put('/:id/status', authenticate, authorizeRole(['STAFF', 'ADMIN']), upload.fields([{ name: 'before_image', maxCount: 1 }, { name: 'after_image', maxCount: 1 }]), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  try {
    const request = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completed_at = new Date();
    }

    await prisma.request.update({
      where: { id: Number(id) },
      data: updateData,
    });

    // Update assignment proofs
    if (files) {
      const assignment = await prisma.assignment.findUnique({ where: { request_id: Number(id) } });
      if (assignment) {
        const payload: any = {};
        if (files['before_image']) payload.before_image = `/uploads/${files['before_image'][0].filename}`;
        if (files['after_image']) payload.after_image = `/uploads/${files['after_image'][0].filename}`;
        
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: payload,
        });
      }
    }
    // Staff task load is not decremented upon resolution; it functions as a lifetime 'tasks handled' counter.

    await prisma.notification.create({
      data: { user_id: request.user_id, message: `Your request (${request.category} at ${request.room}) has been marked as ${status}.` }
    });

    return res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Add feedback (Student only)
router.post('/:id/feedback', authenticate, authorizeRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comments } = req.body;
  const userId = req.user!.id;

  try {
    const request = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!request || request.user_id !== userId) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'COMPLETED') return res.status(400).json({ message: 'Request is not completed yet' });

    const feedback = await prisma.feedback.create({
      data: {
        request_id: Number(id),
        user_id: userId,
        rating: Number(rating),
        comments,
      },
    });

    return res.json({ message: 'Feedback submitted', feedback });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel request (Student only)
router.put('/:id/cancel', authenticate, authorizeRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const request = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!request || request.user_id !== userId) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot cancel this request' });
    }

    if (request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS') {
      const assignment = await prisma.assignment.findUnique({ where: { request_id: Number(id) } });
      if (assignment) {
        await prisma.staffProfile.update({
          where: { id: assignment.staff_id },
          data: { tasks_handled: { decrement: 1 } },
        });
      }
    }

    await prisma.request.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
    });

    return res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Confirm resolution (Student only)
router.put('/:id/confirm', authenticate, authorizeRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const request = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!request || request.user_id !== userId) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'RESOLVED') return res.status(400).json({ message: 'Request is not resolved yet' });

    await prisma.request.update({
      where: { id: Number(id) },
      data: { status: 'COMPLETED', completed_at: new Date() },
    });

    const assignment = await prisma.assignment.findUnique({ where: { request_id: Number(id) }, include: { staff: true } });
    if (assignment) {
      await prisma.notification.create({
        data: { user_id: assignment.staff.user_id, message: `Task completion confirmed by student: ${request.category} at ${request.room}` }
      });
    }

    return res.json({ message: 'Request confirmed and completed successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Reopen request (Student only)
router.put('/:id/reopen', authenticate, authorizeRole(['STUDENT']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const request = await prisma.request.findUnique({ where: { id: Number(id) } });
    if (!request || request.user_id !== userId) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Request cannot be reopened once it has been formally confirmed as completed.' });
    }
    if (request.status !== 'RESOLVED' && request.status !== 'CANCELLED') {
      return res.status(400).json({ message: 'Request cannot be reopened from its current state' });
    }

    const assignment = await prisma.assignment.findUnique({ where: { request_id: Number(id) }, include: {staff: true} });
    
    if (assignment) {
      // Removed tasks_handled increment to prevent double counting on reopened requests
      await prisma.notification.create({
         data: { user_id: assignment.staff.user_id, message: `Task reopened by student: ${request.category} at ${request.room}` }
      });
    }

    await prisma.request.update({
      where: { id: Number(id) },
      data: { status: assignment ? 'ASSIGNED' : 'PENDING' },
    });

    return res.json({ message: 'Request reopened successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
