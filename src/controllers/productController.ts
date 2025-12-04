import { Request, Response } from 'express';
import { productService } from '../services/productService';

export const productController = {
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, price, description, category } = req.body;

      if (!name || !price) {
        res.status(400).json({ error: 'Nome e preço são obrigatórios' });
        return;
      }

      const product = await productService.createProduct(name, price, description, category);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.query;
      const products = await productService.getAllProducts(category as string | undefined);
      res.status(200).json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(parseInt(id));

      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }

      res.status(200).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, price, description, category } = req.body;

      const product = await productService.updateProduct(parseInt(id), {
        name,
        price,
        description,
        category,
      });

      res.status(200).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await productService.deleteProduct(parseInt(id));
      res.status(200).json({ message: 'Produto deletado com sucesso' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
