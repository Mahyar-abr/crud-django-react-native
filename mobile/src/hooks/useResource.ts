/**
 * Hook réutilisable : charger des données quand l’écran devient actif et les recharger.
 * Copie pédagogique : les commentaires expliquent le code existant.
 */
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Le nom use... indique un hook. On le place au niveau principal d’un composant.
// load est une fonction à appeler plus tard, pas le résultat d’une requête déjà lancée.
// T représente le type de données : tableau de produits, produit, etc.
export function useResource<T>(load: () => Promise<T>) {
  // L’état retient les données entre les rendus ; null signifie qu’aucun résultat n’est encore arrivé.
  // setData déclenche le rendu qui permettra à l’écran d’afficher les données.
  const [data, setData] = useState<T | null>(null);
  // L’écran utilise loading pour afficher un indicateur de chargement.
  const [loading, setLoading] = useState(true);
  // Une chaîne vide signifie qu’aucun message d’erreur n’est actuellement affiché.
  const [error, setError] = useState('');
  // Ce compteur sert à provoquer un nouveau chargement manuel ; ce n’est pas la version du produit.
  const [version, setVersion] = useState(0);
  // reload augmente le compteur à partir de sa valeur précédente.
  // useCallback conserve la référence de cette fonction ; [] signifie aucune dépendance variable.
  const reload = useCallback(() => setVersion(value => value + 1), []);

  // useFocusEffect exécute le chargement lorsque cet écran devient actif dans la navigation.
  // Il le réexécute aussi, tant que l’écran est actif, lorsque load ou version change.
  // C’est utile après un retour depuis le formulaire ou un rafraîchissement manuel.
  useFocusEffect(useCallback(() => {
    // Protection locale à ce chargement : une ancienne réponse ne doit pas mettre à jour un écran quitté.
    let active = true;
    // Commence le chargement et conserve les données précédentes si elles existent.
    setLoading(true);
    // Efface le message du chargement précédent avant cette nouvelle tentative.
    setError('');
    // Appelle la fonction réseau. then traite sa réussite.
    load().then(value => {
      // Applique le résultat uniquement si ce chargement est encore actif.
      if (active) setData(value);
    // catch traite une erreur provenant de l’API ou du chargement.
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Erreur de chargement.');
    // finally termine l’indicateur de chargement, que la requête ait réussi ou échoué.
    }).finally(() => {
      if (active) setLoading(false);
    });
    // Fonction de nettoyage appelée à la perte du focus, au démontage ou avant la réexécution.
    // Elle ignore les réponses tardives ; elle n’annule pas elle-même la requête HTTP.
    return () => { active = false; };
    // La dépendance version est volontaire : le compteur provoque une nouvelle exécution.
    // La directive ESLint suivante s’applique à la ligne des dépendances ; elle est conservée.
    // version déclenche aussi un chargement lors d’un rafraîchissement manuel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, version]));

  // Retourne les quatre outils dont les écrans ont besoin pour gérer l’affichage et le rafraîchissement.
  return { data, loading, error, reload };
}