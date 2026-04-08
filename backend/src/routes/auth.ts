import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import nodemailer from 'nodemailer';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const u: any = user;
    if (!u.is_approved) {
      return res.status(403).json({ message: 'Account is pending Admin approval.' });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        room_number: user.room_number,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/signup', async (req, res) => {
  const { name, email, password, room_number, role, specialization } = req.body;

  try {
    if (role === 'STUDENT') {
      if (!email.endsWith('@vitstudent.ac.in')) {
        return res.status(400).json({ message: 'Students must strictly register with a @vitstudent.ac.in email address' });
      }
      if (!room_number || room_number.trim() === '') {
        return res.status(400).json({ message: 'Block and Room Number are exactly mandatory for student registration' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isStaff = role === 'STAFF';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isStaff ? 'STAFF' : 'STUDENT',
        room_number: isStaff ? null : (room_number || null),
        is_approved: isStaff ? false : true,
      },
    });

    if (isStaff) {
      await prisma.staffProfile.create({
        data: {
          user_id: user.id,
          specialization: specialization || 'CLEANING',
          is_available: false,
        }
      });
      return res.status(201).json({
        message: 'Staff registered successfully. Please wait for Admin approval to login.',
      });
    }

    const token = generateToken(user.id, user.role);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        room_number: user.room_number,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, new_password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found with that email.' });

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    return res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
