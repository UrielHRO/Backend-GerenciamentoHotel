import bcrypt from 'bcryptjs';
import { generateToken } from '../middlewares/auth';
import prisma from '../database/prismaClient';

export const authService = {
  async login(email: string, password: string) {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new Error('Administrador não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new Error('Senha inválida');
    }

    const token = generateToken(admin.id);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      token,
    };
  },

  async createAdmin(email: string, password: string, name: string) {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new Error('Administrador com este email já existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  },

  async getAdmin(id: number) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return admin;
  },
};
