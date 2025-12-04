import prisma from '../database/prismaClient';

export const productService = {
  async createProduct(name: string, price: number, description?: string, category?: string) {
    return await prisma.product.create({
      data: {
        name,
        price,
        description,
        category,
      },
    });
  },

  async getAllProducts(category?: string) {
    return await prisma.product.findMany({
      where: category ? { category } : undefined,
    });
  },

  async getProductById(id: number) {
    return await prisma.product.findUnique({
      where: { id },
    });
  },

  async updateProduct(
    id: number,
    data: {
      name?: string;
      price?: number;
      description?: string;
      category?: string;
    }
  ) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  },

  async deleteProduct(id: number) {
    // Verificar se o produto tem consumos registrados
    const consumptionCount = await prisma.consumption.count({
      where: { productId: id },
    });

    if (consumptionCount > 0) {
      throw new Error('Não é possível deletar um produto com consumos registrados');
    }

    return await prisma.product.delete({
      where: { id },
    });
  },
};
