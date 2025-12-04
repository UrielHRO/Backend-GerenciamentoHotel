import { Request, Response } from 'express';
import { roomService } from '../services/roomService';

export const roomController = {
  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { number, floor, capacity, roomType, dailyRate, nightRate } = req.body;

      if (!number || floor === undefined || !capacity || !roomType || !dailyRate || !nightRate) {
        res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        return;
      }

      const room = await roomService.createRoom(number, floor, capacity, roomType, dailyRate, nightRate);
      res.status(201).json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const rooms = await roomService.getAllRooms(
        status ? { status: status as any } : undefined
      );
      res.status(200).json(rooms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const room = await roomService.getRoomById(parseInt(id));

      if (!room) {
        res.status(404).json({ error: 'Quarto não encontrado' });
        return;
      }

      res.status(200).json(room);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { number, floor, capacity, roomType, dailyRate, nightRate, status } = req.body;

      const room = await roomService.updateRoom(parseInt(id), {
        number,
        floor,
        capacity,
        roomType,
        dailyRate,
        nightRate,
        status,
      });

      res.status(200).json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await roomService.deleteRoom(parseInt(id));
      res.status(200).json({ message: 'Quarto deletado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateRoomStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ error: 'Status é obrigatório' });
        return;
      }

      const room = await roomService.updateRoomStatus(parseInt(id), status);
      res.status(200).json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
