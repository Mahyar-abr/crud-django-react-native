import type { Product } from './types';

export function stockStatus(product: Product) {
  if (product.quantity === 0) return { label: 'Rupture', color: '#a82020', background: '#fee2e2' };
  if (product.quantity <= product.alert_threshold) {
    return { label: 'Stock faible', color: '#855400', background: '#fff0c2' };
  }
  return { label: 'Normal', color: '#166534', background: '#dcfce7' };
}

export function parseQuantity(value: string, minimum = 0): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) throw new Error('Saisis une quantité entière valide.');
  const number = Number(trimmed);
  if (!Number.isSafeInteger(number) || number < minimum || number > 2147483647) {
    throw new Error(`La quantité doit être comprise entre ${minimum} et 2147483647.`);
  }
  return number;
}

export function filterProducts(products: Product[], search: string, category: string | null) {
  const query = search.trim().toLocaleLowerCase();
  return products.filter(product =>
    (category === null || product.category === category)
    && (!query || `${product.name} ${product.reference}`.toLocaleLowerCase().includes(query))
  );
}
