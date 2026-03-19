import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";
import { JSX } from "react/jsx-runtime";
import { View, Text } from "react-native";

// Custom Toast Configuration

export const toastConfig = {
  success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "green", backgroundColor: "#0f1520", height: undefined }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      text1Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 18,
        color: "#f3f4f6",
      }}
      text2Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),

  info: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "#3b82f6", backgroundColor: "#0f1520", height: undefined }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      text1Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 18,
        color: "#f3f4f6",
      }}
      text2Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),

  error: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "#ef4444", backgroundColor: "#0f1520", height: undefined }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingVertical: 10,
      }}
      text1Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 18,
        color: "#ef4444",
      }}
      text2Style={{
        fontFamily: "Lexend-Medium",
        fontSize: 15,
        color: "#f3f4f6",
      }}
    />
  ),

  milestone: ({ text1, text2 }: JSX.IntrinsicAttributes & BaseToastProps) => (
    <View
      style={{
        width: "85%",
        borderWidth: 1,
        borderColor: "#f59e0b",
        borderRadius: 8,
        backgroundColor: "#0f1520",
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Lexend-Medium",
          fontSize: 18,
          color: "#f3f4f6",
          textAlign: "center",
        }}
      >
        {text1} 🎉
      </Text>
      {text2 ? (
        <Text
          style={{
            fontFamily: "Lexend-Medium",
            fontSize: 15,
            color: "#d1d5db",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  ),
};
