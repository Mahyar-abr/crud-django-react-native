import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { RootStackParamList } from './src/types';
import { ProductListScreen } from './src/screens/ProductListScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { ProductFormScreen } from './src/screens/ProductFormScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{
          headerTintColor: '#173f37',
          contentStyle: { backgroundColor: '#f4f7f6' },
        }}>
          <Stack.Screen name="Products" component={ProductListScreen}
            options={{ title: 'Mon entrepôt' }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen}
            options={{ title: 'Détail du produit' }} />
          <Stack.Screen name="ProductForm" component={ProductFormScreen}
            options={({ route }) => ({
              title: route.params?.productId ? 'Modifier le produit' : 'Nouveau produit',
            })} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
