import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const generateToken = (userId: number, role: string) => {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: number; role: string };
};
