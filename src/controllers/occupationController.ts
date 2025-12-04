import { Request, Response } from 'express';
import { occupationService, CreateOccupationData, CompanionData } from '../services/occupationService';

export const occupationController = {
  async createOccupation(req: Request, res: Response): Promise<void> {
    try {
      const {
        roomId,
        responsibleName,
        responsibleCPF,
        responsiblePhone,
        responsibleBirthDate,
        carPlate,
        checkInDate,
        expectedCheckOut,
        roomRate,
        initialConsumption,
        companions,
      } = req.body;

      // Validar campos obrigatórios do responsável
      if (!roomId || !responsibleName || !responsibleCPF || !responsiblePhone || 
          !responsibleBirthDate || !checkInDate || !expectedCheckOut || !roomRate) {
        res.status(400).json({
          error: 'roomId, responsibleName, responsibleCPF, responsiblePhone, responsibleBirthDate, checkInDate, expectedCheckOut e roomRate são obrigatórios',
        });
        return;
      }

      const occupationData: CreateOccupationData = {
        roomId,
        responsibleName,
        responsibleCPF,
        responsiblePhone,
        responsibleBirthDate: new Date(responsibleBirthDate),
        carPlate,
        checkInDate: new Date(checkInDate),
        expectedCheckOut: new Date(expectedCheckOut),
        roomRate,
        initialConsumption,
        companions: companions?.map((companion: any) => ({
          name: companion.name,
          cpf: companion.cpf,
          birthDate: new Date(companion.birthDate),
        })),
      };

      const occupation = await occupationService.createOccupation(occupationData);
      res.status(201).json(occupation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getOccupationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const occupation = await occupationService.getOccupationById(parseInt(id));

      if (!occupation) {
        res.status(404).json({ error: 'Ocupação não encontrada' });
        return;
      }

      res.status(200).json(occupation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getActiveOccupationByRoomId(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const occupation = await occupationService.getActiveOccupationByRoomId(parseInt(roomId));

      if (!occupation) {
        res.status(404).json({ error: 'Nenhuma ocupação ativa encontrada para este quarto' });
        return;
      }

      res.status(200).json(occupation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAllOccupations(req: Request, res: Response): Promise<void> {
    try {
      const { status, roomId } = req.query;
      const occupations = await occupationService.getAllOccupations({
        status: status as any,
        roomId: roomId ? parseInt(roomId as string) : undefined,
      });
      res.status(200).json(occupations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async addConsumption(req: Request, res: Response): Promise<void> {
    try {
      const { occupationId } = req.params;
      const { productId, quantity, unitPrice } = req.body;

      if (!productId || quantity === undefined || unitPrice === undefined) {
        res.status(400).json({
          error: 'productId, quantity e unitPrice são obrigatórios',
        });
        return;
      }

      const consumption = await occupationService.addConsumption(
        parseInt(occupationId),
        productId,
        quantity,
        unitPrice
      );

      res.status(201).json(consumption);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async completeCheckOut(req: Request, res: Response): Promise<void> {
    try {
      const { occupationId } = req.params;
      const { serviceChargePercentage } = req.body;

      const result = await occupationService.completeCheckOut(
        parseInt(occupationId),
        serviceChargePercentage || 10
      );

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteOccupation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await occupationService.deleteOccupation(parseInt(id));
      res.status(200).json({ message: 'Ocupação deletada com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
