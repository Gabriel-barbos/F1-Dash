import {
  useFonts,
  TitilliumWeb_600SemiBold,
  TitilliumWeb_700Bold,
  TitilliumWeb_700Bold_Italic,
  TitilliumWeb_900Black
} from '@expo-google-fonts/titillium-web';

/**
 * Tipografia estilo broadcast F1 (Titillium Web é a fonte livre mais próxima do Formula1 Display).
 * Se a fonte ainda não carregou, o RN usa a fonte do sistema (nunca quebra).
 */
export const F1Font = {
  semi: 'TitilliumWeb_600SemiBold',
  bold: 'TitilliumWeb_700Bold',
  boldItalic: 'TitilliumWeb_700Bold_Italic',
  black: 'TitilliumWeb_900Black'
} as const;

export function useF1Fonts(): boolean {
  const [loaded] = useFonts({
    TitilliumWeb_600SemiBold,
    TitilliumWeb_700Bold,
    TitilliumWeb_700Bold_Italic,
    TitilliumWeb_900Black
  });
  return loaded;
}
