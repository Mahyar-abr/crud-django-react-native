import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { api } from '../api';
import { parseQuantity } from '../domain';
import { useResource } from '../hooks/useResource';
import { Button, ErrorBox, Field, Panel, StockBadge, styles } from '../components/UI';

export function ProductDetailScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ProductDetail'>) {
  const { productId } = route.params;
  const load = useCallback(() => api.get(productId), [productId]);
  const { data: product, loading, error, reload } = useResource(load);
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const [movementError, setMovementError] = useState('');
  const inFlight = useRef(false);

  async function move(type: 'in' | 'out') {
    if (inFlight.current) return;
    setMovementError('');
    try {
      const amount = parseQuantity(quantity, 1);
      inFlight.current = true;
      setBusy(true);
      await api.movement(productId, type, amount);
      setQuantity('1');
      reload();
      Alert.alert('Mouvement enregistré', `${type === 'in' ? 'Entrée' : 'Sortie'} de ${amount} unité(s).`);
    } catch (reason) {
      setMovementError(reason instanceof Error ? reason.message : 'Erreur lors du mouvement.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ErrorBox message={error} retry={reload} />
      {loading && <ActivityIndicator color="#176451" style={{ marginBottom: 12 }} />}
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
        <Button title="Modifier le produit" disabled={busy || loading}
          onPress={() => navigation.navigate('ProductForm', { productId })} />
        <Panel>
          <Text style={[styles.title, { fontSize: 20 }]}>Mouvement de stock</Text>
          <Field label="Nombre d’unités" value={quantity} onChangeText={setQuantity}
            keyboardType="number-pad" editable={!busy} />
          <ErrorBox message={movementError} />
          <Button title={busy ? 'Enregistrement…' : '+ Entrée de stock'}
            disabled={busy || loading} onPress={() => { void move('in'); }} />
          <Button title="− Sortie de stock" danger disabled={busy || loading || product.quantity === 0}
            onPress={() => { void move('out'); }} />
        </Panel>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
