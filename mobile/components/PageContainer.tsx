import { View, ViewProps } from "react-native";

export default function PageContainer({
  children,
  className,
  ...props
}: ViewProps) {
  return (
    <View className="flex-1 w-full px-5 pt-5 pb-10">
      <View
        className={`flex-1 max-w-md mx-auto w-full ${className}`}
        {...props}
      >
        {children}
      </View>
    </View>
  );
}
