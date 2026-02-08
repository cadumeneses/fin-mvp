import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { loadProfileData, saveProfileData } from "../storage/profile";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export function ProfileScreen() {
  const [name, setName] = useState("Camila");
  const [email, setEmail] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const data = await loadProfileData();
        if (!data || !isMounted) return;
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
      } catch {
        Alert.alert("Perfil", "Nao foi possivel carregar seus dados.");
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Fotos", "Permita o acesso as fotos para continuar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
    }
  };

  const handleSave = async () => {
    try {
      await saveProfileData({ name, email });
      Alert.alert("Perfil", "Dados salvos com sucesso.");
    } catch {
      Alert.alert("Perfil", "Nao foi possivel salvar seus dados.");
    }
  };

  return (
    <Screen withTopInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.photoBlock}>
            <View style={styles.avatar}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{name.slice(0, 1) || "?"}</Text>
              )}
            </View>
            <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonText}>Adicionar foto</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Perfil</Text>
          <Text style={styles.subtitle}>
            Prepara para login com Google ou Apple.
          </Text>
          <TextField label="Nome" value={name} onChangeText={setName} />
          <TextField label="Email" value={email} onChangeText={setEmail} />

          <PrimaryButton label="Salvar" onPress={handleSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  photoBlock: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 90,
    height: 90,
  },
  avatarText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: "600",
    color: colors.text,
  },
  photoButton: {
    marginTop: spacing.sm,
  },
  photoButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginBottom: spacing.md,
  },
});
