import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";
import { JSX } from "react/jsx-runtime";

// Custom Toast Configuration

export const toastConfig = {
  success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "green", backgroundColor: "#0f1520", overflow: "hidden" }}
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
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "#3b82f6", backgroundColor: "#0f1520", overflow: "hidden" }}
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
      style={{ borderWidth: 1, borderColor: "#3b82f6", borderLeftWidth: 5, borderLeftColor: "#ef4444", backgroundColor: "#0f1520", overflow: "hidden" }}
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
};
