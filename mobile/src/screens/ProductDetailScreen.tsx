/**
 * Détail d’un produit et traitement d’une entrée ou d’une sortie de stock.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { api } from '../api';
import { parseQuantity } from '../domain';
import { useResource } from '../hooks/useResource';
import { Button, ErrorBox, Field, Panel, StockBadge, styles } from '../components/UI';

// route contient les paramètres transmis par la liste ; navigation permet d’ouvrir le formulaire.
export function ProductDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ProductDetail'>) {
  // Récupère l’identifiant du produit sélectionné, nécessaire à l’URL de l’API.
  const { productId } = route.params;
  // Conserve la fonction de chargement tant que l’identifiant ne change pas.
  // useCallback ne lance pas la requête : load() sera appelée par useResource.
  const load = useCallback(() => api.get(productId), [productId]);
  // data: product renomme localement la propriété data en product.
  // Le hook charge le détail et sait le rafraîchir après un mouvement.
  const { data: product, loading, error, reload } = useResource(load);
  // Le TextInput manipule du texte : la conversion en nombre se fera juste avant l’envoi.
  const [quantity, setQuantity] = useState('1');
  // État d’enregistrement distinct de loading, qui représente une lecture du produit.
  const [busy, setBusy] = useState(false);
  // L’erreur d’un mouvement est affichée près des boutons ; elle est distincte de l’erreur de lecture.
  const [movementError, setMovementError] = useState('');
  // Verrou local immédiat contre deux envois simultanés.
  // Une ref conserve sa valeur entre les rendus ; la modifier ne déclenche pas de rendu.
  const inFlight = useRef(false);

  // Gestionnaire commun : « in » ajoute, « out » retire. async permet d’attendre la réponse HTTP.
  async function move(type: 'in' | 'out') {
    // Ignore un nouvel appui tant que ce composant a déjà un mouvement en cours.
    if (inFlight.current) return;
    // Efface l’erreur précédente avant de valider cette tentative.
    setMovementError('');
    try {
      // Exige un entier au moins égal à 1. Une saisie invalide déclenche catch avant l’appel API.
      const amount = parseQuantity(quantity, 1);
      // Verrouille immédiatement ; setBusy(true) demande aussi un rendu avec boutons désactivés.
      inFlight.current = true;
      setBusy(true);
      // Envoie POST /api/products/{id}/movements/ et attend la réussite.
      // Django vérifie les données et applique le changement dans SQLite.
      // La réponse contient le produit actualisé, mais cet écran choisit ensuite de le relire.
      await api.movement(productId, type, amount);
      // Après réussite, réinitialise la saisie pour le prochain mouvement.
      setQuantity('1');
      // Déclenche un nouveau GET du produit ; setData dans useResource actualisera l’affichage.
      // reload ne renvoie pas une promesse attendue ici : la lecture est gérée séparément par le hook.
      reload();
      // Affiche une confirmation native. Le ? : choisit le libellé selon le type de mouvement.
      Alert.alert('Mouvement enregistré', `${type === 'in' ? 'Entrée' : 'Sortie'} de ${amount} unité(s).`);
    // Une erreur de validation ou de réseau est convertie en message pour l’interface.
    } catch (reason) {
      setMovementError(reason instanceof Error ? reason.message : 'Erreur lors du mouvement.');
    // Libère le verrou et l’état busy après réussite ou erreur.
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // ScrollView permet de consulter le détail sur un petit écran.
  // loading && ... affiche l’indicateur uniquement pendant une lecture.
  // product && ... empêche de lire les champs avant l’arrivée du produit.
  // La description utilise un texte de secours si elle est vide ; new Date formate la date en français.
  // « Modifier » transmet productId au même formulaire que celui utilisé pour créer.
  // Le champ quantité est contrôlé par quantity/setQuantity.
  // Les boutons reçoivent des fonctions : move est appelée à l’appui, pas pendant le rendu.
  // void indique que le gestionnaire n’utilise pas la promesse, dont les erreurs sont traitées dans move.
  // La sortie est désactivée à stock zéro ; Django vérifie aussi les sorties supérieures au stock.
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ErrorBox message={error} retry={reload} />
      {loading && <ActivityIndicator color="#176451" style={{ marginBottom: 12 }} />}
      {/* N’affiche les informations et les mouvements que si un produit est disponible. */}
      {product && <>
        <Panel>
          <StockBadge product={product} />
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.subtitle}>Référence : {product.reference}</Text>
          <Text style={styles.subtitle}>Catégorie : {product.category}</Text>
          <Text style={styles.subtitle}>{product.description || 'Aucune description.'}</Text>
          <View style={styles.row}><Text>Quantité en stock</Text><Text style={styles.value}>{product.quantity}</Text></View>
          <View style={styles.row}><Text>Seuil d’alerte</Text><Text style={styles.value}>{product.alert_threshold}</Text></View>
          <Text style={styles.subtitle}>Dernière mise à jour : {new Date(product.updated_at).toLocaleString('fr-FR')}</Text>
        </Panel>
        {/* Transmet l’identifiant pour ouvrir le formulaire prérempli. */}
        <Button title="Modifier le produit" disabled={busy || loading}
          onPress={() => navigation.navigate('ProductForm', { productId })} />
        <Panel>
          <Text style={[styles.title, { fontSize: 20 }]}>Mouvement de stock</Text>
          {/* Saisie du nombre d’unités du mouvement, distinct du stock actuel du produit. */}
          <Field label="Nombre d’unités" value={quantity} onChangeText={setQuantity}
            keyboardType="number-pad" editable={!busy} />
          {/* Affiche ici les erreurs de saisie, de réseau ou de stock insuffisant. */}
          <ErrorBox message={movementError} />
          {/* Entrée : le gestionnaire appellera move("in") à l’appui. */}
          <Button title={busy ? 'Enregistrement…' : '+ Entrée de stock'}
            disabled={busy || loading} onPress={() => { void move('in'); }} />
          {/* Sortie : désactivée à stock zéro ; Django contrôle aussi la quantité demandée. */}
          <Button title="− Sortie de stock" danger disabled={busy || loading || product.quantity === 0}
            onPress={() => { void move('out'); }} />
        </Panel>
      </>}
    </ScrollView>
  </SafeAreaView>;
}