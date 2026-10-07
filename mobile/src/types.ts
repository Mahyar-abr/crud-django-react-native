export type Product = {
  id: number;
  name: string;
  reference: string;
  description: string;
  category: string;
  quantity: number;
  alert_threshold: number;
  updated_at: string;
};

export type ProductInput = Omit<Product, 'id' | 'updated_at'>;

export type RootStackParamList = {
  Products: undefined;
  ProductDetail: { productId: number };
  ProductForm: { productId?: number } | undefined;
};
