import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(value => value + 1), []);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    load().then(value => {
      if (active) setData(value);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Erreur de chargement.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
    // version déclenche aussi un chargement lors d’un rafraîchissement manuel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, version]));

  return { data, loading, error, reload };
}
