import { DrawerActions, NavigationContainer } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
  useDrawerStatus,
} from "@react-navigation/drawer";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CategoriesScreen } from "../screens/CategoriesScreen";
import { CategoryFormScreen } from "../screens/CategoryFormScreen";
import { CategoryInsightsScreen } from "../screens/CategoryInsightsScreen";
import { EditTransactionScreen } from "../screens/EditTransactionScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NewTransactionScreen } from "../screens/NewTransactionScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TransactionsScreen } from "../screens/TransactionsScreen";
import { loadProfileData } from "../storage/profile";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [name, setName] = useState("Camila");
  const [email, setEmail] = useState("");
  const insets = useSafeAreaInsets();
  const drawerStatus = useDrawerStatus();

  const loadProfile = useCallback(async () => {
    try {
      const data = await loadProfileData();
      if (data?.name) setName(data.name);
      if (data?.email) setEmail(data.email);
    } catch {
      setName("Camila");
      setEmail("");
    }
  }, []);

  useEffect(() => {
    if (drawerStatus === "open") {
      loadProfile();
    }
  }, [drawerStatus, loadProfile]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      <View style={[styles.drawerHeader, { paddingTop: spacing.lg + insets.top }]}>
        <View style={styles.drawerAvatar}>
          <Text style={styles.drawerAvatarText}>{name.slice(0, 1) || "?"}</Text>
        </View>
        <View>
          <Text style={styles.drawerName}>{name}</Text>
          {email ? <Text style={styles.drawerEmail}>{email}</Text> : null}
        </View>
      </View>
      <View style={styles.drawerSection}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}

function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: {
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.sm,
          paddingBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="Transacoes"
        component={TransactionsScreen}
        options={{ tabBarLabel: "Transacoes" }}
      />
      <Tabs.Screen
        name="Categorias"
        component={CategoriesScreen}
        options={{ tabBarLabel: "Categorias" }}
      />
    </Tabs.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleStyle: { fontFamily: typography.fontFamily },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={AppTabs}
        options={({ navigation }) => ({
          title: "",
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{ marginLeft: 12 }}
              hitSlop={8}
            >
              <Ionicons name="menu" size={24} color={colors.primary} />
            </Pressable>
          ),
          headerTitle: () => <Text />,
        })}
      />
      <Stack.Screen
        name="NewTransaction"
        component={NewTransactionScreen}
        options={{ title: "Nova transacao" }}
      />
      <Stack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{ title: "Editar transacao" }}
      />
      <Stack.Screen
        name="CategoryForm"
        component={CategoryFormScreen}
        options={{ title: "Categoria" }}
      />
      <Stack.Screen
        name="CategoryInsights"
        component={CategoryInsightsScreen}
        options={{ title: "Resumo" }}
      />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: typography.fontFamily, fontWeight: "400" },
          medium: { fontFamily: typography.fontFamily, fontWeight: "500" },
          bold: { fontFamily: typography.fontFamily, fontWeight: "700" },
          heavy: { fontFamily: typography.fontFamily, fontWeight: "700" },
        },
      }}
    >
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.muted,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="Inicio"
          component={MainStack}
          options={{ drawerLabel: "Inicio" }}
        />
        <Drawer.Screen
          name="Perfil"
          component={ProfileScreen}
          options={{ headerShown: true, title: "Perfil" }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  drawerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  drawerAvatarText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "700",
    color: colors.text,
  },
  drawerName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  drawerEmail: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: 2,
  },
  drawerSection: {
    paddingTop: spacing.sm,
  },
});
