import prisma from '../database/prismaClient';
import redisClient from '../database/redisClient';

export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
export type RoomType = 'STANDARD' | 'DELUXE' | 'SUITE' | 'PREMIUM';

export const roomService = {
  // Função auxiliar para invalidar cache
  async invalidateRoomCache() {
    try {
      const keys = await redisClient.keys('rooms:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log('🗑️ Cache de quartos invalidado');
      }
    } catch (error) {
      console.error('⚠️ Erro ao invalidar cache:', error);
    }
  },

  async createRoom(
    number: string,
    floor: number,
    capacity: number,
    roomType: RoomType,
    dailyRate: number,
    nightRate: number
  ) {
    const existingRoom = await prisma.room.findUnique({
      where: { number },
    });

    if (existingRoom) {
      throw new Error(`Quarto ${number} já existe`);
    }

    const room = await prisma.room.create({
      data: {
        number,
        floor,
        capacity,
        roomType,
        dailyRate,
        nightRate,
        status: 'AVAILABLE',
      },
    });

    // Invalidar cache após criação
    await this.invalidateRoomCache();

    return room;
  },

  async getAllRooms(filter?: { status?: RoomStatus }) {
    // Criar chave de cache baseada no filtro
    const cacheKey = filter?.status 
      ? `rooms:status:${filter.status}` 
      : 'rooms:all';

    try {
      // Tentar buscar do cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        console.log('🚀 Dados retornados do cache Redis');
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('⚠️ Erro ao buscar cache, consultando banco:', error);
    }

    // Se não houver cache, buscar do banco
    const rooms = await prisma.room.findMany({
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

    try {
      // Salvar no cache por 5 minutos (300 segundos)
      await redisClient.setex(cacheKey, 300, JSON.stringify(rooms));
      console.log('💾 Dados salvos no cache Redis');
    } catch (error) {
      console.error('⚠️ Erro ao salvar no cache:', error);
    }

    return rooms;
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
      roomType?: RoomType;
      dailyRate?: number;
      nightRate?: number;
      status?: RoomStatus;
    }
  ) {
    const room = await prisma.room.update({
      where: { id },
      data,
    });

    // Invalidar cache após atualização
    await this.invalidateRoomCache();

    return room;
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

    const room = await prisma.room.delete({
      where: { id },
    });

    // Invalidar cache após deleção
    await this.invalidateRoomCache();

    return room;
  },

  async updateRoomStatus(id: number, status: RoomStatus) {
    const room = await prisma.room.update({
      where: { id },
      data: { status },
    });

    // Invalidar cache após atualização de status
    await this.invalidateRoomCache();

    return room;
  },
};
