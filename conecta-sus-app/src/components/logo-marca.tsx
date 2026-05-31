import { Image, View } from "react-native";

interface Props {
  size?: number;
}

export function LogoMarca({ size = 64 }: Props) {
  const radius = Math.round(size * 0.22);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={{ width: size, height: size }}
        resizeMode="cover"
        accessibilityLabel="Tem no SUS!"
      />
    </View>
  );
}
