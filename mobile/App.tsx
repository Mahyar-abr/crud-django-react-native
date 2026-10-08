/**
 * Entrée de l’application : déclaration des trois écrans et de leur navigation.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
// Les imports récupèrent des composants et des fonctions fournis par les bibliothèques.
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/types';
// import type sert uniquement à TypeScript : ces types ne deviennent pas du code exécuté sur le téléphone.
import { ProductListScreen } from './src/screens/ProductListScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { ProductFormScreen } from './src/screens/ProductFormScreen';
// Crée une pile de navigation : ouvrir un écran puis revenir à l’écran précédent.
// RootStackParamList vérifie les noms des écrans et leurs paramètres pendant le développement.
const Stack = createNativeStackNavigator<RootStackParamList>();

// Expo charge ce composant racine par le point d’entrée du projet.
// Une fonction composant renvoie du JSX, c’est-à-dire une description de l’interface.

export default function App() {
    // SafeAreaProvider fournit les informations sur les zones occupées par le système du téléphone.
  // StatusBar règle ici la couleur du texte de la barre d’état.
  // NavigationContainer contient le système de navigation ; Stack.Navigator contient les écrans.
  // screenOptions applique des styles communs à leurs en-têtes et à leur contenu.
  // Le premier écran déclaré, Products, est l’écran initial de cette pile.
  // Chaque Stack.Screen associe un nom de route à un composant.
  // Pour ProductForm, options reçoit route : un identifiant indique une modification.
  // Le ?. évite une erreur si aucun paramètre n’est transmis lors d’une création.
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* Conteneur de toute la navigation entre les écrans. */}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerTintColor: '#173f37',
          contentStyle: { backgroundColor: '#f4f7f6' },
        }}>
          {/* Écran initial : la liste des produits. */}
          <Stack.Screen name="Products" component={ProductListScreen}
            options={{ title: 'Mon entrepôt' }} />
            {/* Écran détail : reçoit productId et charge le produit concerné. */}
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen}
            options={{ title: 'Détail du produit' }} />
            {/* Même écran pour créer ou modifier ; le titre dépend de la présence de productId. */}
          <Stack.Screen name="ProductForm" component={ProductFormScreen}
            options={({ route }) => ({
              title: route.params?.productId ? 'Modifier le produit' : 'Nouveau produit',
            })} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
