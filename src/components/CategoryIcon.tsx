import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type CategoryIconProps = {
  name?: string | null;
  size?: number;
  color?: string;
};

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const fallbackIcon: IconName = "help-circle-outline";

export function CategoryIcon({ name, size = 18, color = colors.text }: CategoryIconProps) {
  const resolved =
    name && name in MaterialCommunityIcons.glyphMap ? (name as IconName) : fallbackIcon;
  return <MaterialCommunityIcons name={resolved} size={size} color={color} />;
}
