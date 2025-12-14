import AppText from "../AppText";

export default function ForgotPasswordText({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <>
      <AppText
        className="text-center text-lg  mb-4 underline"
        onPress={onPress}
      >
        Forgot Password?
      </AppText>
    </>
  );
}
