import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { api } from '../api';
import { filterProducts } from '../domain';
import { useResource } from '../hooks/useResource';
import { Button, ErrorBox, Field, Panel, StockBadge, styles } from '../components/UI';

export function ProductListScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Products'>) {
  const { data, loading, error, reload } = useResource(api.list);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const products = data ?? [];
  const categories = useMemo(() => Array.from(new Set((data ?? []).map(p => p.category))).sort(), [data]);
  const visible = filterProducts(products, search, category);
  const empty = products.filter(p => p.quantity === 0).length;
  const low = products.filter(p => p.quantity > 0 && p.quantity <= p.alert_threshold).length;

  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    <FlatList data={visible} keyExtractor={item => String(item.id)}
      contentContainerStyle={styles.content} refreshing={loading} onRefresh={reload}
      ListHeaderComponent={<View>
        <Text style={styles.title}>Gestion de stock</Text>
        <Text style={styles.subtitle}>Consulte tes produits et enregistre les mouvements.</Text>
        <Panel>
          <View style={styles.row}>
            <Text>Produits</Text><Text style={styles.value}>{products.length}</Text>
          </View>
          <View style={styles.row}><Text>En rupture</Text><Text style={styles.value}>{empty}</Text></View>
          <View style={styles.row}><Text>Stock faible</Text><Text style={styles.value}>{low}</Text></View>
        </Panel>
        <Button title="+ Ajouter un produit" onPress={() => navigation.navigate('ProductForm')} />
        <Field label="Rechercher un nom ou une référence" value={search} onChangeText={setSearch}
          placeholder="Ex. clavier, CLA-001" autoCorrect={false} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {[null, ...categories].map(value => <Pressable key={value ?? '__all__'}
            accessibilityRole="button" accessibilityState={{ selected: category === value }}
            style={[styles.chip, category === value && { backgroundColor: '#176451' }]}
            onPress={() => setCategory(value)}>
            <Text style={{ color: category === value ? '#fff' : '#173f37' }}>{value ?? 'Toutes'}</Text>
          </Pressable>)}
        </ScrollView>
        <ErrorBox message={error} retry={reload} />
        {loading && !data && <ActivityIndicator size="large" color="#176451" />}
      </View>}
      ListEmptyComponent={!loading && !error ? <Text style={styles.subtitle}>
        {products.length === 0 ? 'Aucun produit. Ajoute ton premier article.' : 'Aucun produit ne correspond aux filtres.'}
      </Text> : null}
      renderItem={({ item }) => <Pressable accessibilityRole="button"
        accessibilityLabel={`Voir ${item.name}, ${item.quantity} unités`}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
        <Panel>
          <StockBadge product={item} />
          <Text style={[styles.title, { fontSize: 20 }]}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.category} · {item.reference}</Text>
          <View style={styles.row}>
            <Text>Stock : {item.quantity}</Text><Text>Seuil : {item.alert_threshold}</Text>
          </View>
          <Text style={{ color: '#176451', fontWeight: '600' }}>Voir le détail →</Text>
        </Panel>
      </Pressable>} />
  </SafeAreaView>;
}
