import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../middlewares/auth';

export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha são obrigatórios' });
        return;
      }

      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  },

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
        return;
      }

      const admin = await authService.createAdmin(email, password, name);
      res.status(201).json(admin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.adminId) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      const admin = await authService.getAdmin(req.adminId);
      res.status(200).json(admin);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
