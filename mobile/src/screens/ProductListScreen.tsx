/**
 * Écran principal : liste, recherche, filtre par catégorie et résumé du stock.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { api } from '../api';
import { filterProducts } from '../domain';
import { useResource } from '../hooks/useResource';
import { Button, ErrorBox, Field, Panel, StockBadge, styles } from '../components/UI';

// React Navigation fournit navigation. Le type vérifie les routes et les paramètres utilisés.
export function ProductListScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Products'>) {
  // Transmet api.list au hook ; le hook la lance quand l’écran devient actif.
  // La syntaxe { ... } récupère les propriétés de l’objet retourné.
  const { data, loading, error, reload } = useResource(api.list);
  // La recherche est un état local : sa modification provoque un nouveau rendu et un nouveau filtre.
  const [search, setSearch] = useState('');
  // null correspond à « Toutes » ; sinon la valeur est le nom exact d’une catégorie.
  const [category, setCategory] = useState<string | null>(null);
  // Avant la première réponse, utilise un tableau vide pour pouvoir calculer et afficher la liste.
  const products = data ?? [];
  // map récupère les catégories ; Set supprime les doublons ; Array.from recrée un tableau ; sort trie.
  // useMemo conserve ce résultat tant que data ne change pas, même si la recherche change.
  const categories = useMemo(() => Array.from(new Set((data ?? []).map(p => p.category))).sort(), [data]);
  // Applique recherche et catégorie sur les données téléchargées, sans nouvel appel à Django.
  const visible = filterProducts(products, search, category);
  // Compte les références en rupture, et non le nombre d’unités stockées.
  const empty = products.filter(p => p.quantity === 0).length;
  // Compte les stocks faibles en excluant les ruptures.
  // Les compteurs utilisent tous les produits, même lorsque la liste visible est filtrée.
  const low = products.filter(p => p.quantity > 0 && p.quantity <= p.alert_threshold).length;

  // L’en-tête est géré par la navigation ; SafeAreaView protège les autres bords.
  // FlatList affiche efficacement les éléments et utilise l’id comme clé stable.
  // refreshing/onRefresh permettent de tirer la liste vers le bas pour recharger.
  // ListHeaderComponent contient le résumé, le bouton de création et les filtres.
  // Field est contrôlé : value lit search, onChangeText appelle setSearch.
  // Le ScrollView horizontal contient « Toutes » et les catégories uniques.
  // ErrorBox permet une nouvelle tentative ; le premier chargement affiche un indicateur.
  // ListEmptyComponent distingue une base vide d’une recherche sans résultat.
  // renderItem reçoit chaque item et construit sa carte ; l’appui transmet seulement son id au détail.
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.page}>
    {/* Liste des résultats filtrés ; l’id reste une clé stable entre les rendus. */}
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
        {/* Sans identifiant transmis, le formulaire sera en mode création. */}
        <Button title="+ Ajouter un produit" onPress={() => navigation.navigate('ProductForm')} />
        {/* Champ contrôlé : chaque saisie actualise search et recalcule la liste visible. */}
        <Field label="Rechercher un nom ou une référence" value={search} onChangeText={setSearch}
          placeholder="Ex. clavier, CLA-001" autoCorrect={false} />
        {/* Les catégories défilent horizontalement pour rester accessibles sur un petit écran. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {[null, ...categories].map(value => <Pressable key={value ?? '__all__'}
            accessibilityRole="button" accessibilityState={{ selected: category === value }}
            style={[styles.chip, category === value && { backgroundColor: '#176451' }]}
            onPress={() => setCategory(value)}>
            <Text style={{ color: category === value ? '#fff' : '#173f37' }}>{value ?? 'Toutes'}</Text>
          </Pressable>)}
        </ScrollView>
        {/* En cas d’erreur de lecture, Réessayer relance le chargement. */}
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
          {/* La carte combine le badge métier, le nom, la catégorie et les quantités. */}
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