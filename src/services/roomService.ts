import prisma from '../database/prismaClient';

export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export const roomService = {
  async createRoom(
    number: string,
    floor: number,
    capacity: number,
    dailyRate: number
  ) {
    const existingRoom = await prisma.room.findUnique({
      where: { number },
    });

    if (existingRoom) {
      throw new Error(`Quarto ${number} já existe`);
    }

    return await prisma.room.create({
      data: {
        number,
        floor,
        capacity,
        dailyRate,
        status: 'AVAILABLE',
      },
    });
  },

  async getAllRooms(filter?: { status?: RoomStatus }) {
    return await prisma.room.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      include: {
        occupations: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
          orderBy: {
            checkInDate: 'desc',
          },
        },
      },
    });
  },

  async getRoomById(id: number) {
    return await prisma.room.findUnique({
      where: { id },
      include: {
        occupations: {
          orderBy: {
            checkInDate: 'desc',
          },
        },
      },
    });
  },

  async updateRoom(
    id: number,
    data: {
      number?: string;
      floor?: number;
      capacity?: number;
      dailyRate?: number;
      status?: RoomStatus;
    }
  ) {
    return await prisma.room.update({
      where: { id },
      data,
    });
  },

  async deleteRoom(id: number) {
    // Verificar se há ocupações ativas
    const activeOccupation = await prisma.occupation.findFirst({
      where: {
        roomId: id,
        status: 'ACTIVE',
      },
    });

    if (activeOccupation) {
      throw new Error('Não é possível deletar um quarto com ocupação ativa');
    }

    return await prisma.room.delete({
      where: { id },
    });
  },

  async updateRoomStatus(id: number, status: RoomStatus) {
    return await prisma.room.update({
      where: { id },
      data: { status },
    });
  },
};
