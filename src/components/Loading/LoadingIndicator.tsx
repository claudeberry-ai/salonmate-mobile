import { View, Text, ActivityIndicator } from 'react-native';

type LoadingIndicatorProps = {
  color: string;
  text?: string; // Optional prop
};

export default function LoadingIndicator({ color, text }: LoadingIndicatorProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={color} />
      {text && <Text className="mt-5 text-gray-700">{text}</Text>}
    </View>
  );
}
