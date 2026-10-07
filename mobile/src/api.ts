import type { Product, ProductInput } from './types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const fieldLabels: Record<string, string> = {
  name: 'Nom', reference: 'Référence', description: 'Description',
  category: 'Catégorie', quantity: 'Quantité', alert_threshold: "Seuil d’alerte",
};

function errorMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(errorMessage).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, message]) =>
      `${fieldLabels[key] ?? key} : ${errorMessage(message)}`
    ).join('\n');
  }
  return 'Erreur de validation.';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error('Configure EXPO_PUBLIC_API_URL dans le fichier .env, puis redémarre Expo.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : null; }
    catch { throw new Error(`Réponse inattendue du serveur (HTTP ${response.status}). Vérifie l’URL et Django.`); }
    if (!response.ok) throw new Error(errorMessage(data));
    return data as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Le serveur ne répond pas. Vérifie Django et la connexion Wi-Fi.');
    if (error instanceof TypeError) throw new Error('API inaccessible. Vérifie son adresse, le serveur Django et le Wi-Fi.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  list: () => request<Product[]>('/products/'),
  get: (id: number) => request<Product>(`/products/${id}/`),
  create: (product: ProductInput) => request<Product>('/products/', {
    method: 'POST', body: JSON.stringify(product),
  }),
  update: (id: number, product: Partial<ProductInput>) => request<Product>(`/products/${id}/`, {
    method: 'PATCH', body: JSON.stringify(product),
  }),
  movement: (id: number, type: 'in' | 'out', quantity: number) =>
    request<Product>(`/products/${id}/movements/`, {
      method: 'POST', body: JSON.stringify({ type, quantity }),
    }),
};
