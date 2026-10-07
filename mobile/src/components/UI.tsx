import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import type { Product } from '../types';
import { stockStatus } from '../domain';

export function Button({ title, onPress, disabled = false, danger = false }: {
  title: string; onPress: () => void; disabled?: boolean; danger?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, danger && { backgroundColor: '#a82020' },
      (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...props} accessibilityLabel={label} placeholderTextColor="#697c76"
      style={[styles.input, props.multiline && { minHeight: 90 },
        props.editable === false && { backgroundColor: '#e7edeb' }, props.style]} />
  </View>;
}

export function StockBadge({ product }: { product: Product }) {
  const status = stockStatus(product);
  return <View style={[styles.badge, { backgroundColor: status.background }]}>
    <Text style={{ color: status.color, fontWeight: '700' }}>{status.label}</Text>
  </View>;
}

export function Panel({ children }: { children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  if (!message) return null;
  return <View style={styles.error}>
    <Text accessibilityLiveRegion="polite" style={{ color: '#a82020', marginBottom: 8 }}>{message}</Text>
    {retry && <Button title="Réessayer" onPress={retry} />}
  </View>;
}

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f7f6' },
  content: { padding: 18, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#173f37', marginBottom: 8 },
  subtitle: { color: '#586d65', fontSize: 15, marginBottom: 12 },
  label: { fontWeight: '600', color: '#173f37', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#becfc8', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, minHeight: 48,
    fontSize: 16, backgroundColor: '#fff', color: '#173f37' },
  button: { minHeight: 48, borderRadius: 10, backgroundColor: '#176451',
    alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 10 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  panel: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce6e1',
    borderRadius: 14, padding: 16, marginBottom: 14 },
  badge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 10 },
  error: { backgroundColor: '#fff0ee', padding: 14, borderRadius: 10, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  value: { color: '#173f37', fontWeight: '700', fontSize: 18 },
  chip: { minHeight: 48, paddingHorizontal: 14, justifyContent: 'center',
    borderRadius: 24, backgroundColor: '#e4ece8', marginRight: 8 },
});
