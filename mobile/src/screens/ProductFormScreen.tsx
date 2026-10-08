/**
 * Formulaire partagé : création sans identifiant, modification avec identifiant.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Product, RootStackParamList } from '../types';
import { api } from '../api';
import { parseQuantity } from '../domain';
import { useResource } from '../hooks/useResource';
import { Button, ErrorBox, Field, styles } from '../components/UI';

// Tous les champs sont des textes car TextInput renvoie des chaînes, même avec un clavier numérique.
type Form = { name: string; reference: string; description: string; category: string; quantity: string; threshold: string };
// Valeurs initiales pour une création : stock zéro et seuil de cinq unités.
const initial: Form = { name: '', reference: '', description: '', category: '', quantity: '0', threshold: '5' };

// Ce composant gère le chargement ; ProductEditor gère ensuite la saisie et l’enregistrement.
export function ProductFormScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ProductForm'>) {
  // ?. donne undefined si aucun paramètre n’est fourni. Présent = produit existant.
  const productId = route.params?.productId;
  // Détermine si le produit doit être téléchargé pour préremplir les champs.
  const editing = productId !== undefined;
  // Modification : GET du produit. Création : promesse déjà résolue avec null, sans requête HTTP.
  // Les deux cas utilisent le même hook ; la fonction reste stable tant que productId ne change pas.
  const load = useCallback(() => productId !== undefined ? api.get(productId) : Promise.resolve(null), [productId]);
  // L’erreur de chargement permet de réessayer sans afficher un formulaire prérempli incorrectement.
  const { data: product, loading, error, reload } = useResource(load);

  // Attend la fin du chargement avant de monter ProductEditor.
  // En modification, exige aussi un produit chargé.
  // onSaved est une fonction transmise à l’éditeur : elle revient à l’écran précédent après réussite.
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    <ErrorBox message={error} retry={reload} />
    {/* Affiche d’abord le chargement, puis l’éditeur avec ses bonnes valeurs initiales. */}
    {loading ? <ActivityIndicator color="#176451" /> : (!editing || product) &&
      <ProductEditor product={product} onSaved={() => navigation.goBack()} />}
  </SafeAreaView>;
}

// Le formulaire est monté après le chargement, avec ses valeurs initiales.
// Composant enfant : reçoit un produit existant ou null, ainsi qu’une fonction de retour.
function ProductEditor({ product, onSaved }: { product: Product | null; onSaved: () => void }) {
  // Récupère l’id si un produit existe ; sinon undefined indique une création.
  const productId = product?.id;
  // Détermine notamment si le champ quantité doit être en lecture seule.
  const editing = product !== null;
  // Récupère la hauteur de l’en-tête pour ajuster la disposition lorsque le clavier apparaît.
  const headerHeight = useHeaderHeight();
  // Initialisation différée : React appelle cette fonction lors de l’initialisation de l’état.
  // Le parent attend les données avant de monter cet éditeur.
  // Les champs d’un produit existant sont copiés ; les nombres deviennent des textes avec String.
  // Sinon on utilise initial. Un nouveau rendu ordinaire ne réinitialise pas la saisie.
  const [form, setForm] = useState<Form>(() => product ? {
    name: product.name, reference: product.reference, description: product.description,
    category: product.category, quantity: String(product.quantity), threshold: String(product.alert_threshold),
  } : initial);
  // Pendant la demande d’enregistrement, les champs et le bouton sont désactivés.
  const [busy, setBusy] = useState(false);
  // Message de validation locale ou erreur renvoyée par le serveur.
  const [error, setError] = useState('');
  // Verrou immédiat pour éviter deux créations/modifications simultanées depuis cet éditeur.
  const inFlight = useRef(false);

  // keyof Form limite field aux noms de champs connus : name, reference, etc.
  function change(field: keyof Form, value: string) {
    // Part de l’état précédent, copie tous ses champs avec ...current et remplace le champ choisi.
    // [field] est une clé calculée : change("name", "Clavier") remplace uniquement name.
    // Créer un nouvel objet permet à React de prendre en compte ce changement d’état.
    setForm(current => ({ ...current, [field]: value }));
  }

  // Appelée par le bouton Enregistrer ; valide puis choisit POST ou PATCH.
  async function save() {
    // Ignore un nouvel appui si une demande est déjà en cours.
    if (inFlight.current) return;
    // Efface l’erreur de la tentative précédente.
    setError('');
    try {
      // Retire les espaces extérieurs des champs obligatoires avant la vérification et l’envoi.
      const name = form.name.trim();
      const reference = form.reference.trim();
      const category = form.category.trim();
      // Une chaîne vide est fausse en JavaScript : !name détecte donc un nom vide après trim.
      if (!name || !reference || !category) throw new Error('Le nom, la référence et la catégorie sont obligatoires.');
      // Convertit en entier valide, avec minimum 0 par défaut ; Django refait les validations.
      const quantity = parseQuantity(form.quantity);
      // Le formulaire nomme le champ threshold ; le contrat API utilise alert_threshold.
      const alert_threshold = parseQuantity(form.threshold);
      // Prépare les informations et le seuil, sans quantity.
      // En modification, ce choix évite de remplacer un stock récent par une ancienne valeur du formulaire.
      const metadata = { name, reference, category, description: form.description.trim(), alert_threshold };
      // Le verrou prend effet immédiatement ; busy déclenche le rendu des contrôles désactivés.
      inFlight.current = true;
      setBusy(true);
      // Identifiant présent : produit existant, donc modification partielle.
      if (productId !== undefined) {
        // PATCH /api/products/{id}/ avec les informations, sans modification de quantité.
        // La quantité existante se modifie dans notre interface avec les mouvements de stock.
        await api.update(productId, metadata);
      } else {
        // Sans identifiant : POST /api/products/. Ajoute la quantité initiale aux informations.
        // ...metadata copie les champs de l’objet dans l’objet envoyé.
        await api.create({ ...metadata, quantity });
      }
      // Exécutée uniquement après réussite : le parent appelle navigation.goBack().
      // L’écran précédent reprend le focus et recharge ses données avec useResource.
      onSaved();
    // Conserve le formulaire et affiche le message si la validation ou l’enregistrement échoue.
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erreur lors de l’enregistrement.');
    // Retire le verrou et termine busy même après une erreur.
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Alias utilisé par les props editable et disabled dans le formulaire.
  const disabled = busy;

  // Adapte l’espace disponible à l’ouverture du clavier ; le comportement dépend de la plateforme.
  // Le ScrollView permet d’atteindre tous les champs et le bouton sur un petit écran.
  // keyboardShouldPersistTaps permet de transmettre les appuis aux contrôles quand le clavier est ouvert.
  // Chaque Field est contrôlé : value lit form, onChangeText appelle change.
  // maxLength limite la saisie selon les tailles définies par le modèle Django.
  // Le clavier numérique facilite la saisie mais parseQuantity reste nécessaire.
  // Le stock existant est en lecture seule ; le seuil reste modifiable.
  // Le bouton transmet une fonction : save ne s’exécute qu’à l’appui.
  // void indique que l’événement n’utilise pas la promesse retournée ; save traite ses erreurs.
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* v est le nouveau texte ; change remplace uniquement le champ name dans l’état. */}
        <Field label="Nom *" value={form.name} maxLength={150} editable={!disabled} onChangeText={v => change('name', v)} />
        <Field label="Référence *" value={form.reference} maxLength={50} autoCapitalize="characters"
          autoCorrect={false} editable={!disabled} onChangeText={v => change('reference', v)} />
        <Field label="Catégorie *" value={form.category} maxLength={100} editable={!disabled} onChangeText={v => change('category', v)} />
        {/* Description facultative et multiligne ; sa valeur est aussi pilotée par form. */}
        <Field label="Description" value={form.description} multiline textAlignVertical="top"
          editable={!disabled} onChangeText={v => change('description', v)} />
        {/* En création, la quantité initiale est modifiable ; en modification, elle est en lecture seule. */}
        <Field label={editing ? 'Stock actuel (à modifier avec les mouvements)' : 'Quantité initiale *'}
          value={form.quantity} keyboardType="number-pad" editable={!disabled && !editing}
          onChangeText={v => change('quantity', v)} />
        {/* Le seuil sera validé et converti en nombre avant son envoi sous le nom alert_threshold. */}
        <Field label="Seuil d’alerte *" value={form.threshold} keyboardType="number-pad"
          editable={!disabled} onChangeText={v => change('threshold', v)} />
        <ErrorBox message={error} />
        {/* Le bouton lance save et reste désactivé pendant la demande. */}
        <Button title={busy ? 'Enregistrement…' : 'Enregistrer'} disabled={disabled} onPress={() => { void save(); }} />
      </ScrollView>
    </KeyboardAvoidingView>;
}