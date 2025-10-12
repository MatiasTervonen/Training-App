import AppText from "../AppText";

export default function ResendEmailText({
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
        Didn&apos;t get an email?
      </AppText>
    </>
  );
}
