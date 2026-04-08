import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import userRoutes from './routes/users';
import staffRoutes from './routes/staff';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import path from 'path';

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running smoothly.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
