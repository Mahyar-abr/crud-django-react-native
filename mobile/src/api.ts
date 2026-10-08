/**
 * Client HTTP : toutes les demandes du mobile à l’API Django passent par ce fichier.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import type { Product, ProductInput } from './types';

// Lit l’adresse de base depuis .env, par exemple http://192.168.1.31:8000/api.
// ?? fournit une valeur de secours si la variable manque ; replace retire les slashs finaux.
// Les variables EXPO_PUBLIC_ sont visibles dans le code client : elles ne doivent contenir aucun secret.
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

// Dictionnaire clé -> libellé français pour afficher les erreurs de validation du backend.
// Record<string, string> décrit un objet dont les clés et les valeurs sont des textes.
const fieldLabels: Record<string, string> = {
  name: 'Nom', reference: 'Référence', description: 'Description',
  category: 'Catégorie', quantity: 'Quantité', alert_threshold: "Seuil d’alerte",
};

// Django peut renvoyer un texte, une liste de messages ou un objet par champ.
// unknown oblige à examiner la valeur avant de l’utiliser.
function errorMessage(value: unknown): string {
  // Un message déjà sous forme de texte est conservé.
  if (typeof value === 'string') return value;
  // Traite chaque message d’une liste, puis les rassemble.
  // L’appel à errorMessage dans errorMessage est une récursion.
  if (Array.isArray(value)) return value.map(errorMessage).join(' ');
  // value évite de traiter null comme un objet ; typeof null vaut aussi « object » en JavaScript.
  if (value && typeof value === 'object') {
    // Object.entries donne les paires [nom du champ, erreur] ; map formate chaque paire.
    // Le libellé français est utilisé s’il existe, sinon le nom du champ est conservé.
    return Object.entries(value).map(([key, message]) =>
      `${fieldLabels[key] ?? key} : ${errorMessage(message)}`
    ).join('\n');
  }
  return 'Erreur de validation.';
}

// Fonction commune aux opérations API : path est ajouté à l’adresse de base.
// init contient les options HTTP (méthode, corps, en-têtes). Par défaut fetch utilise GET.
// T indique le type attendu : Product ou Product[]. async renvoie une promesse.
// await suspend la suite de cette fonction pendant l’attente, sans bloquer toute l’interface.
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Une configuration absente provoque une erreur explicite avant l’envoi.
  if (!API_URL) throw new Error('Configure EXPO_PUBLIC_API_URL dans le fichier .env, puis redémarre Expo.');
  // Permet d’interrompre cette requête avec un signal d’annulation.
  const controller = new AbortController();
  // Après dix secondes, annule la requête pour éviter une attente indéfinie.
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    // Assemble l’URL complète : adresse /api + chemin /products/ = /api/products/.
    // fetch renvoie une Response HTTP ; il ne sauvegarde rien dans l’état React.
    const response = await fetch(`${API_URL}${path}`, {
      // L’opérateur ... copie les options de l’appelant dans les options de fetch.
      ...init,
      // Annonce un corps JSON et conserve les éventuels en-têtes supplémentaires.
      headers: { 'Content-Type': 'application/json', ...init.headers },
      // Relie fetch au mécanisme d’annulation créé plus haut.
      signal: controller.signal,
    });
    // Lit le corps sous forme de texte pour pouvoir détecter aussi une page HTML d’erreur Django.
    const text = await response.text();
    // La structure du contenu réseau n’est pas encore connue.
    let data: unknown;
    // JSON.parse transforme le texte JSON en valeur JavaScript. Un corps vide devient null.
    try { data = text ? JSON.parse(text) : null; }
    // Une réponse non JSON est convertie en erreur compréhensible.
    catch { throw new Error(`Réponse inattendue du serveur (HTTP ${response.status}). Vérifie l’URL et Django.`); }
    // fetch peut réussir à recevoir une réponse HTTP 400 ou 404.
    // Il faut vérifier response.ok, qui correspond aux statuts HTTP de réussite 200 à 299.
    if (!response.ok) throw new Error(errorMessage(data));
    // Renvoie les données à l’écran ou au hook appelant.
    // as T est une affirmation de type TypeScript : cela ne valide pas la structure du JSON à l’exécution.
    return data as T;
  // Traduit les erreurs d’annulation et certaines erreurs réseau, puis transmet les autres erreurs.
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Le serveur ne répond pas. Vérifie Django et la connexion Wi-Fi.');
    if (error instanceof TypeError) throw new Error('API inaccessible. Vérifie son adresse, le serveur Django et le Wi-Fi.');
    // Relance l’erreur pour que le hook ou l’écran puisse l’afficher.
    throw error;
  } finally {
    // finally s’exécute après réussite ou échec : retire le minuteur devenu inutile.
    clearTimeout(timeout);
  }
}

// Interface utilisée par les écrans : ils appellent ces fonctions plutôt que fetch directement.
export const api = {
  // GET : renvoie une liste. Le backend attendu doit répondre avec un tableau sans pagination.
  list: () => request<Product[]>('/products/'),
  // GET : insère l’identifiant dans le chemin pour lire un produit.
  get: (id: number) => request<Product>(`/products/${id}/`),
  // POST : création. ProductInput ne contient ni id ni date générée par Django.
  create: (product: ProductInput) => request<Product>('/products/', {
    // JSON.stringify transforme l’objet JavaScript en texte JSON envoyé dans le corps HTTP.
    method: 'POST', body: JSON.stringify(product),
  }),
  // PATCH : modification partielle ; Partial permet de fournir seulement certains champs.
  // Le formulaire de notre mobile utilise cette opération pour les informations et le seuil.
  update: (id: number, product: Partial<ProductInput>) => request<Product>(`/products/${id}/`, {
    method: 'PATCH', body: JSON.stringify(product),
  }),
  // POST : entrée ou sortie. Le backend vérifie la quantité et le stock disponible.
  // Le type TypeScript limite les appels du code à « in » et « out ».
  movement: (id: number, type: 'in' | 'out', quantity: number) =>
    request<Product>(`/products/${id}/movements/`, {
      // Exemple de corps envoyé : {"type":"in","quantity":3}.
      // La réponse attendue contient le produit après le mouvement.
      method: 'POST', body: JSON.stringify({ type, quantity }),
    }),
};