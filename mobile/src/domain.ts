/**
 * Règles métier du mobile : statut du stock, validation numérique et filtres.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import type { Product } from './types';

// Fonction sans appel réseau : calcule un libellé et des couleurs à partir d’un produit.
export function stockStatus(product: Product) {
  // Tester zéro en premier : une rupture ne doit pas être classée simplement comme stock faible.
  if (product.quantity === 0) return { label: 'Rupture', color: '#a82020', background: '#fee2e2' };
  // Le seuil est inclus : quantité égale au seuil = stock faible.
  if (product.quantity <= product.alert_threshold) {
    return { label: 'Stock faible', color: '#855400', background: '#fff0c2' };
  }
  // On arrive ici uniquement si la quantité est strictement supérieure au seuil.
  return { label: 'Normal', color: '#166534', background: '#dcfce7' };
}

// Les champs de saisie renvoient du texte : cette fonction le valide avant de produire un nombre.
// minimum vaut 0 par défaut ; pour un mouvement, l’écran passe 1.
export function parseQuantity(value: string, minimum = 0): number {
  // Retire les espaces au début et à la fin de la saisie.
  const trimmed = value.trim();
  // L’expression régulière accepte uniquement une suite non vide de chiffres.
  // Elle refuse notamment les champs vides, les décimales, les signes négatifs et les lettres.
  if (!/^\d+$/.test(trimmed)) throw new Error('Saisis une quantité entière valide.');
  // Convertit le texte validé en nombre JavaScript.
  const number = Number(trimmed);
  // Vérifie la précision de l’entier, la borne minimale et une borne maximale compatible
  // avec la plage portable du PositiveIntegerField utilisé par le modèle Django.
  if (!Number.isSafeInteger(number) || number < minimum || number > 2147483647) {
    throw new Error(`La quantité doit être comprise entre ${minimum} et 2147483647.`);
  }
  // throw interrompt la fonction en cas d’erreur ; sinon on obtient un nombre utilisable dans le JSON.
  return number;
}

// Filtrage local du tableau déjà téléchargé : aucune requête HTTP n’est envoyée ici.
// category = null signifie « toutes les catégories ».
export function filterProducts(products: Product[], search: string, category: string | null) {
  // Normalise la recherche pour ignorer les espaces extérieurs et les différences de majuscules.
  const query = search.trim().toLocaleLowerCase();
  // filter produit un nouveau tableau sans modifier le tableau d’origine.
  // Un produit doit satisfaire à la fois le filtre catégorie et la recherche dans nom/référence.
  // Une recherche vide ne réduit pas les résultats.
  return products.filter(product =>
    (category === null || product.category === category)
    && (!query || `${product.name} ${product.reference}`.toLocaleLowerCase().includes(query))
  );
}