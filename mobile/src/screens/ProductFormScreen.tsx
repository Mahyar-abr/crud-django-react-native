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

type Form = { name: string; reference: string; description: string; category: string; quantity: string; threshold: string };
const initial: Form = { name: '', reference: '', description: '', category: '', quantity: '0', threshold: '5' };

export function ProductFormScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'ProductForm'>) {
  const productId = route.params?.productId;
  const editing = productId !== undefined;
  const load = useCallback(() => productId !== undefined ? api.get(productId) : Promise.resolve(null), [productId]);
  const { data: product, loading, error, reload } = useResource(load);

  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    <ErrorBox message={error} retry={reload} />
    {loading ? <ActivityIndicator color="#176451" /> : (!editing || product) &&
      <ProductEditor product={product} onSaved={() => navigation.goBack()} />}
  </SafeAreaView>;
}

// Le formulaire est monté après le chargement, avec ses valeurs initiales.
function ProductEditor({ product, onSaved }: { product: Product | null; onSaved: () => void }) {
  const productId = product?.id;
  const editing = product !== null;
  const headerHeight = useHeaderHeight();
  const [form, setForm] = useState<Form>(() => product ? {
    name: product.name, reference: product.reference, description: product.description,
    category: product.category, quantity: String(product.quantity), threshold: String(product.alert_threshold),
  } : initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  function change(field: keyof Form, value: string) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function save() {
    if (inFlight.current) return;
    setError('');
    try {
      const name = form.name.trim();
      const reference = form.reference.trim();
      const category = form.category.trim();
      if (!name || !reference || !category) throw new Error('Le nom, la référence et la catégorie sont obligatoires.');
      const quantity = parseQuantity(form.quantity);
      const alert_threshold = parseQuantity(form.threshold);
      const metadata = { name, reference, category, description: form.description.trim(), alert_threshold };
      inFlight.current = true;
      setBusy(true);
      if (productId !== undefined) {
        await api.update(productId, metadata);
      } else {
        await api.create({ ...metadata, quantity });
      }
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erreur lors de l’enregistrement.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const disabled = busy;

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Nom *" value={form.name} maxLength={150} editable={!disabled} onChangeText={v => change('name', v)} />
        <Field label="Référence *" value={form.reference} maxLength={50} autoCapitalize="characters"
          autoCorrect={false} editable={!disabled} onChangeText={v => change('reference', v)} />
        <Field label="Catégorie *" value={form.category} maxLength={100} editable={!disabled} onChangeText={v => change('category', v)} />
        <Field label="Description" value={form.description} multiline textAlignVertical="top"
          editable={!disabled} onChangeText={v => change('description', v)} />
        <Field label={editing ? 'Stock actuel (à modifier avec les mouvements)' : 'Quantité initiale *'}
          value={form.quantity} keyboardType="number-pad" editable={!disabled && !editing}
          onChangeText={v => change('quantity', v)} />
        <Field label="Seuil d’alerte *" value={form.threshold} keyboardType="number-pad"
          editable={!disabled} onChangeText={v => change('threshold', v)} />
        <ErrorBox message={error} />
        <Button title={busy ? 'Enregistrement…' : 'Enregistrer'} disabled={disabled} onPress={() => { void save(); }} />
      </ScrollView>
    </KeyboardAvoidingView>;
}
