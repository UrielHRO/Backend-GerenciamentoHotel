import prisma from '../database/prismaClient';
import { roomService } from './roomService';

export interface CompanionData {
  name: string;
  cpf: string;
  birthDate: Date;
}

export interface CreateOccupationData {
  roomId: number;
  // Dados do responsável
  responsibleName: string;
  responsibleCPF: string;
  responsiblePhone: string;
  responsibleBirthDate: Date;
  carPlate?: string;
  checkInDate: Date;
  expectedCheckOut: Date;
  roomRate: number;
  initialConsumption?: number;
  companions?: CompanionData[];
}

// Função para validar maioridade (18 anos)
function validateAdultAge(birthDate: Date): boolean {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age >= 18;
}

export const occupationService = {
  async createOccupation(data: CreateOccupationData) {
    // Validar maioridade do responsável
    if (!validateAdultAge(data.responsibleBirthDate)) {
      throw new Error('O responsável pela ocupação deve ser maior de 18 anos');
    }

    // Validar maioridade dos acompanhantes
    if (data.companions && data.companions.length > 0) {
      for (const companion of data.companions) {
        if (!validateAdultAge(companion.birthDate)) {
          throw new Error(`O acompanhante ${companion.name} deve ser maior de 18 anos`);
        }
      }
    }

    // Verificar se o quarto existe
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new Error('Quarto não encontrado');
    }

    // Verificar se há ocupação ativa no quarto
    const activeOccupation = await prisma.occupation.findFirst({
      where: {
        roomId: data.roomId,
        status: 'ACTIVE',
      },
    });

    if (activeOccupation) {
      throw new Error('Quarto já possui uma ocupação ativa');
    }

    // Determinar o status do quarto baseado na data de check-in
    const checkInDate = new Date(data.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);

    let roomStatus: 'RESERVED' | 'OCCUPIED' = 'RESERVED';
    if (checkInDate.getTime() === today.getTime() || checkInDate < today) {
      roomStatus = 'OCCUPIED';
    }

    // Criar a ocupação com acompanhantes
    const occupation = await prisma.occupation.create({
      data: {
        roomId: data.roomId,
        responsibleName: data.responsibleName,
        responsibleCPF: data.responsibleCPF,
        responsiblePhone: data.responsiblePhone,
        responsibleBirthDate: new Date(data.responsibleBirthDate),
        carPlate: data.carPlate,
        checkInDate: new Date(data.checkInDate),
        expectedCheckOut: new Date(data.expectedCheckOut),
        roomRate: data.roomRate,
        initialConsumption: data.initialConsumption || 0,
        totalConsumption: data.initialConsumption || 0,
        status: 'ACTIVE',
        companions: {
          create: data.companions?.map(companion => ({
            name: companion.name,
            cpf: companion.cpf,
            birthDate: new Date(companion.birthDate),
          })) || [],
        },
      },
      include: {
        companions: true,
      },
    });

    // Atualizar o status do quarto
    await prisma.room.update({
      where: { id: data.roomId },
      data: { status: roomStatus },
    });

    // Invalidar cache do Redis
    await roomService.invalidateRoomCache();

    return occupation;
  },

  async getOccupationById(id: number) {
    return await prisma.occupation.findUnique({
      where: { id },
      include: {
        room: true,
        companions: true,
        consumptions: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async getActiveOccupationByRoomId(roomId: number) {
    return await prisma.occupation.findFirst({
      where: {
        roomId,
        status: 'ACTIVE',
      },
      include: {
        room: true,
        companions: true,
        consumptions: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  async getAllOccupations(filter?: { status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'; roomId?: number }) {
    return await prisma.occupation.findMany({
      where: {
        status: filter?.status || undefined,
        roomId: filter?.roomId || undefined,
      },
      include: {
        room: true,
        companions: true,
        consumptions: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });
  },

  async addConsumption(occupationId: number, productId: number, quantity: number, unitPrice: number) {
    // Verificar se a ocupação existe
    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
    });

    if (!occupation) {
      throw new Error('Ocupação não encontrada');
    }

    if (occupation.status !== 'ACTIVE') {
      throw new Error('Ocupação não está ativa');
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Produto não encontrado');
    }

    const totalPrice = quantity * unitPrice;

    // Criar o consumo
    const consumption = await prisma.consumption.create({
      data: {
        occupationId,
        productId,
        quantity,
        unitPrice,
        totalPrice,
      },
      include: {
        product: true,
      },
    });

    // Atualizar o consumo total da ocupação
    const totalConsumption = await prisma.consumption.aggregate({
      where: { occupationId },
      _sum: {
        totalPrice: true,
      },
    });

    await prisma.occupation.update({
      where: { id: occupationId },
      data: {
        totalConsumption: totalConsumption._sum.totalPrice || 0,
      },
    });

    return consumption;
  },

  async completeCheckOut(occupationId: number, serviceChargePercentage: number = 10) {
    // Obter a ocupação com seus consumos
    const occupation = await prisma.occupation.findUnique({
      where: { id: occupationId },
      include: {
        consumptions: {
          include: {
            product: true,
          },
        },
        companions: true,
        room: true,
      },
    });

    if (!occupation) {
      throw new Error('Ocupação não encontrada');
    }

    if (occupation.status !== 'ACTIVE') {
      throw new Error('Ocupação não está ativa');
    }

    // Detalhar cada despesa
    const expenseDetails = occupation.consumptions.map(consumption => ({
      productName: consumption.product.name,
      quantity: consumption.quantity,
      unitPrice: consumption.unitPrice,
      totalPrice: consumption.totalPrice,
      date: consumption.createdAt,
    }));

    // Calcular o preço final
    const subtotal = occupation.roomRate + (occupation.totalConsumption || 0);
    const serviceCharge = (subtotal * serviceChargePercentage) / 100;
    const finalPrice = subtotal + serviceCharge;

    // Atualizar a ocupação com checkout
    const updatedOccupation = await prisma.occupation.update({
      where: { id: occupationId },
      data: {
        checkOutDate: new Date(),
        serviceCharge,
        finalPrice,
        status: 'COMPLETED',
      },
      include: {
        room: true,
        companions: true,
        consumptions: {
          include: {
            product: true,
          },
        },
      },
    });

    // Atualizar o status do quarto para "CLEANING"
    await prisma.room.update({
      where: { id: occupation.roomId },
      data: { status: 'CLEANING' },
    });

    // Invalidar cache do Redis
    await roomService.invalidateRoomCache();

    return {
      occupation: updatedOccupation,
      summary: {
        roomRate: occupation.roomRate,
        expenses: expenseDetails,
        totalConsumption: occupation.totalConsumption || 0,
        subtotal,
        serviceCharge,
        serviceChargePercentage,
        finalPrice,
      },
    };
  },

  async deleteOccupation(id: number) {
    const occupation = await prisma.occupation.findUnique({
      where: { id },
    });

    if (!occupation) {
      throw new Error('Ocupação não encontrada');
    }

    if (occupation.status === 'ACTIVE') {
      throw new Error('Não é possível deletar uma ocupação ativa');
    }

    // Deletar consumos associados
    await prisma.consumption.deleteMany({
      where: { occupationId: id },
    });

    return await prisma.occupation.delete({
      where: { id },
    });
  },
};
