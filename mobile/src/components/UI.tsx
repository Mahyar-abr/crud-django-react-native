/**
 * Composants réutilisables et styles communs aux trois écrans.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import type { Product } from '../types';
import { stockStatus } from '../domain';

// Les props sont les paramètres reçus du composant parent.
// title est le libellé ; onPress est une fonction à appeler lors de l’appui.
// disabled et danger sont facultatifs avec une valeur false par défaut.
export function Button({ title, onPress, disabled = false, danger = false }: {
  title: string; onPress: () => void; disabled?: boolean; danger?: boolean;
}) {
  // Pressable gère l’appui ; les propriétés accessibility décrivent le contrôle aux lecteurs d’écran.
  // disabled bloque l’appui et la fonction de style adapte l’apparence à pressed/disabled/danger.
  // Un tableau de styles combine un style de base avec des styles conditionnels.
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, danger && { backgroundColor: '#a82020' },
      (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>;
}

// Ce champ regroupe un libellé et un TextInput.
// ...props récupère les autres paramètres : value, onChangeText, keyboardType, etc.
// Le & combine les propriétés natives du TextInput avec notre label obligatoire.
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  // TextInput reçoit les props du parent : l’état de saisie reste géré dans l’écran.
  // multiline augmente la hauteur ; editable=false ajoute une apparence de lecture seule.
  // props.style en dernier permet au parent de compléter ou remplacer certains styles.
  return <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#697c76"
      style={[styles.input, props.multiline && { minHeight: 90 },
        props.editable === false && { backgroundColor: '#e7edeb' }, props.style]} />
  </View>;
}

// Ce composant reçoit un produit et affiche son statut en texte et en couleur.
export function StockBadge({ product }: { product: Product }) {
  // Réutilise les règles de domain.ts au lieu de répéter les conditions dans chaque écran.
  const status = stockStatus(product);
  return <View style={[styles.badge, { backgroundColor: status.background }]}>
    <Text style={{ color: status.color, fontWeight: '700' }}>{status.label}</Text>
  </View>;
}

// children est le contenu placé entre <Panel> et </Panel>.
// ReactNode décrit les contenus que React peut afficher.
export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

// Affiche une erreur et, si retry est fourni, un bouton permettant une nouvelle tentative.
export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  // return null signifie que le composant n’affiche rien en l’absence d’erreur.
  if (!message) return null;
  // La région accessible annonce le message ; retry est transmis au bouton comme fonction onPress.
  return <View style={styles.error}>
    <Text accessibilityLiveRegion="polite" style={{ color: '#a82020', marginBottom: 8 }}>{message}</Text>
    {retry && <Button title="Réessayer" onPress={retry} />}
  </View>;
}

// Styles React Native : ce sont des objets JavaScript, pas une feuille CSS de navigateur.
// Les propriétés utilisent camelCase : backgroundColor, paddingHorizontal, etc.
export const styles = StyleSheet.create({
  // flex: 1 permet à la page d’occuper l’espace disponible dans son conteneur.
  page: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { padding: 18, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#173f37', marginBottom: 8 },
  subtitle: { color: '#586d65', fontSize: 15, marginBottom: 12 },
  label: { fontWeight: '600', color: '#173f37', marginBottom: 6 },
  // Une hauteur minimale de 48 et une police de 16 facilitent la saisie sur mobile.
  input: { borderWidth: 1, borderColor: '#becfc8', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 48,
    fontSize: 16, backgroundColor: '#fff', color: '#173f37' },
  // Hauteur tactile minimale ; alignItems et justifyContent centrent le contenu du bouton.
  button: { minHeight: 48, borderRadius: 10, backgroundColor: '#176451',
    alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce6e1',
    borderRadius: 14, padding: 16, marginBottom: 14 },
  badge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 10 },
  error: { backgroundColor: '#fff0ee', padding: 14, borderRadius: 10, marginBottom: 14 },
  // Place les éléments côte à côte, avec le libellé d’un côté et la valeur de l’autre.
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  value: { color: '#173f37', fontWeight: '700', fontSize: 18 },
  chip: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center',
    borderRadius: 24, backgroundColor: '#e4ece8', marginRight: 8 },
});