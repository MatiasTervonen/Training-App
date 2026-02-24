import { useState, useEffect, useRef } from "react";
import {
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from "react-native";
import AppInput from "@/components/AppInput";
import AppText from "@/components/AppText";
import { useRouter } from "expo-router";
import FullScreenLoader from "@/components/FullScreenLoader";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import GradientButton from "@/components/buttons/GradientButton";
import ForgotPasswordText from "@/features/login-signup/forgotPassword";
import ModalLogin from "@/components/ModalLogin";
import ResendEmailText from "@/features/login-signup/resendEmail";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ArrowLeft } from "lucide-react-native";
import GradientColorText from "@/components/GradientColorText";
import PageContainer from "@/components/PageContainer";
import {
  signInWithEmail,
  signUpWithEmail,
  sendPasswordResetEmail,
  resendEmailVerification,
  guestLogIn,
} from "@/features/login-signup/actions";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation("login");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [activeForm, setActiveForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [modal2Open, setModal2Open] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const router = useRouter();

  const confettiRef = useRef<ConfettiMethods>(null);

  const screenHeight = Dimensions.get("window").height;
  const translateY = useSharedValue(0);

  const resetFields = () => {
    setLogin({ email: "", password: "" });
    setSignup({ email: "", password: "", confirmPassword: "" });
    setForgotPasswordEmail("");
    setResendEmail("");
    setError("");
  };

  useEffect(() => {
    translateY.value = withSpring(activeForm ? -screenHeight : 0, {
      damping: 15,
      stiffness: 120,
      mass: 1,
      overshootClamping: false,
      velocity: 0,
    });
  }, [activeForm, screenHeight, translateY]);

  useEffect(() => {
    if (activeForm) {
      setLogin({ email: "", password: "" });
    } else {
      setSignup({ email: "", password: "", confirmPassword: "" });
    }
  }, [activeForm]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <>
      {signUpSuccess && (
        <View className="absolute inset-0 z-[9999] pointer-events-none">
          <Confetti ref={confettiRef} />
        </View>
      )}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient
          colors={["#0f172a", "#0f172a", "#1e3a8a"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          className="flex-1"
        >
          <PageContainer>
            <View className="flex-row items-center justify-between pt-3 z-50">
              <AnimatedButton onPress={() => router.push("/")} hitSlop={10}>
                <View className="flex-row gap-2 items-center">
                  <ArrowLeft color="#f3f4f6" />
                  <AppText>{t("login.back")}</AppText>
                </View>
              </AnimatedButton>

              <GradientColorText style={{ width: 140, height: 36 }}>
                MyTrack
              </GradientColorText>

              <AppText className="min-w-[65.5px]"></AppText>
            </View>
            <Animated.View
              style={[
                animatedStyle,
                {
                  height: screenHeight * 2,
                  position: "absolute",
                  width: "100%",
                },
              ]}
            >
              {/* Login Form */}

              <View
                style={{ height: screenHeight }}
                className="justify-center max-w-md mx-auto w-full flex-1"
              >
                <AppInput
                  label={t("login.email")}
                  setValue={(text) => {
                    setLogin({ ...login, email: text });
                    setSignup({ ...signup, email: "" });
                  }}
                  value={login.email}
                  placeholder={t("login.emailPlaceholder")}
                  autoCapitalize={"none"}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                />
                <View className="mt-4">
                  <AppInput
                    label={t("login.password")}
                    setValue={(text) => setLogin({ ...login, password: text })}
                    value={login.password}
                    secureTextEntry={true}
                    placeholder={t("login.passwordPlaceholder")}
                    autoCapitalize={"none"}
                    autoComplete="password"
                    textContentType="password"
                    keyboardType="default"
                  />
                </View>
                <View className="mt-10">
                  <GradientButton
                    label={t("login.logIn")}
                    onPress={() => {
                      if (!isValidEmail(login.email)) {
                        Alert.alert("", t("login.invalidEmail"));
                        return;
                      }

                      signInWithEmail({
                        email: login.email,
                        password: login.password,
                        setLoadingMessage,
                        setLoading,
                        setError,
                        onSuccess: () => {},
                      });
                    }}
                  />
                </View>
                <View className="mt-10 items-center">
                  <AppText
                    onPress={() => setGuestModalOpen(true)}
                    className="text-center text-lg mb-4 underline"
                  >
                    {t("login.logInAsGuest")}
                  </AppText>
                </View>
                <View className="mt-6 items-center">
                  <ForgotPasswordText onPress={() => setModalOpen(true)} />
                </View>
                {error && (
                  <View className="mt-6 items-center">
                    <ResendEmailText onPress={() => setModal2Open(true)} />
                  </View>
                )}
              </View>

              {/* Sign Up Form */}

              <View
                style={{ height: screenHeight }}
                className="justify-center max-w-md mx-auto w-full"
              >
                <AppInput
                  label={t("login.email")}
                  setValue={(text) => {
                    setSignup({ ...signup, email: text });
                    setLogin({ ...login, email: "" });
                  }}
                  value={signup.email}
                  placeholder={t("login.emailPlaceholder")}
                  autoCapitalize={"none"}
                  autoComplete="email"
                  textContentType="emailAddress"
                  keyboardType="email-address"
                />
                <View className="mt-4">
                  <AppInput
                    label={t("login.password")}
                    setValue={(text) =>
                      setSignup({ ...signup, password: text })
                    }
                    value={signup.password}
                    secureTextEntry={true}
                    placeholder={t("login.passwordPlaceholder")}
                    autoCapitalize={"none"}
                    autoComplete="password"
                    textContentType="password"
                    keyboardType="default"
                  />
                </View>
                <View className="mt-4">
                  <AppInput
                    label={t("login.confirmPassword")}
                    setValue={(text) =>
                      setSignup({ ...signup, confirmPassword: text })
                    }
                    value={signup.confirmPassword}
                    secureTextEntry={true}
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    autoCapitalize={"none"}
                  />
                </View>
                <View className="mt-10">
                  <GradientButton
                    label={t("login.signUp")}
                    onPress={() => {
                      if (!isValidEmail(signup.email)) {
                        Alert.alert("", t("login.invalidEmail"));
                        return;
                      }

                      signUpWithEmail({
                        email: signup.email,
                        password: signup.password,
                        confirmPassword: signup.confirmPassword,
                        setLoadingMessage,
                        setLoading,
                        setSignUpSuccess,
                        setSignup,
                      });
                    }}
                  />
                </View>

                {success && (
                  <View className="mt-6 items-center">
                    <ResendEmailText onPress={() => setModal2Open(true)} />
                  </View>
                )}
              </View>
            </Animated.View>

            <View className="absolute bottom-0 left-0 w-full flex flex-col justify-center gap-2 pb-5 px-6">
              <AppText className="text-center mb-5 text-xl">
                {activeForm
                  ? t("login.alreadyHaveAccount")
                  : t("login.dontHaveAccount")}
              </AppText>
              <View className="max-w-md mx-auto w-full">
                <GradientButton
                  label={activeForm ? t("login.logIn") : t("login.signUp")}
                  onPress={() => setActiveForm(!activeForm)}
                />
              </View>
            </View>
          </PageContainer>
        </LinearGradient>
      </TouchableWithoutFeedback>

      {/* Success modal */}

      {signUpSuccess && (
        <ModalLogin
          isOpen={signUpSuccess}
          onClose={() => {
            setSignUpSuccess(false);
          }}
        >
          <View className="flex-1 justify-between  px-6 py-10 pb-10 items-center">
            <GradientColorText style={{ width: 140, height: 36 }}>
              MyTrack
            </GradientColorText>
            <AppText className="text-xl mt-5 text-center">
              {t("login.signUpSuccess.title")}
            </AppText>
            <AppText className="text-green-500 text-center">
              {t("login.signUpSuccess.message")}
            </AppText>

            <View className="mt-6 items-center">
              <ResendEmailText onPress={() => setModal2Open(true)} />
            </View>
          </View>
        </ModalLogin>
      )}

      {/* Modal for Resend email verification */}

      {modal2Open && (
        <ModalLogin
          isOpen={modal2Open}
          onClose={() => {
            setModal2Open(false);
            resetFields();
          }}
        >
          <View className="flex-1 justify-between items-center p-6">
            <View className="gap-5">
              <AppText className="text-xl underline mt-5 text-gray-100 text-center">
                {t("login.resendEmail.title")}
              </AppText>
              <AppText className="text-gray-300 text-center">
                {t("login.resendEmail.description")}
              </AppText>
              <AppInput
                label={t("login.email")}
                setValue={(text) => {
                  setResendEmail(text);
                  setLogin({ ...login, email: "" });
                  setSignup({ ...signup, email: "" });
                }}
                value={resendEmail}
                placeholder={t("login.emailPlaceholder")}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
              />
            </View>
            <View className="w-full">
              <GradientButton
                disabled={!resendEmail}
                label={t("login.resendEmail.resendButton")}
                onPress={async () => {
                  if (!isValidEmail(login.email)) {
                    Alert.alert("", t("login.invalidEmail"));
                    return;
                  }

                  await resendEmailVerification({
                    resendEmail: resendEmail,
                    setLoadingMessage,
                    setLoading,
                    setSuccess,
                  });
                  setModal2Open(false);
                  resetFields();
                }}
              />
            </View>
          </View>
        </ModalLogin>
      )}

      {/* Modal for Forgot Password */}

      {modalOpen && (
        <ModalLogin
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            resetFields();
          }}
        >
          <View className="flex-1 justify-between items-center p-6">
            <View className="gap-5">
              <AppText className="text-xl underline mt-5 text-gray-100 text-center">
                {t("login.forgotPassword.title")}
              </AppText>
              <AppText className="text-gray-300 text-center">
                {t("login.forgotPassword.description")}
              </AppText>
              <AppInput
                label={t("login.email")}
                setValue={(text) => {
                  setForgotPasswordEmail(text);
                  setLogin({ ...login, email: "" });
                  setSignup({ ...signup, email: "" });
                }}
                value={forgotPasswordEmail}
                placeholder={t("login.emailPlaceholder")}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
              />
            </View>
            <View className="w-full">
              <GradientButton
                label={t("login.forgotPassword.sendResetLink")}
                onPress={async () => {
                  if (!isValidEmail(login.email)) {
                    Alert.alert("", t("login.invalidEmail"));
                    return;
                  }

                  await sendPasswordResetEmail({
                    forgotPasswordEmail: forgotPasswordEmail,
                    setLoadingMessage,
                    setLoading,
                  });
                  setModalOpen(false);
                  resetFields();
                }}
                disabled={!forgotPasswordEmail}
              />
            </View>
          </View>
        </ModalLogin>
      )}

      {/* Guest Login modal */}

      <ModalLogin
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
      >
        <View className="flex-1 justify-between items-center p-6">
          <GradientColorText style={{ width: 140, height: 36 }}>
            MyTrack
          </GradientColorText>
          <AppText className="text-2xl underline mt-5 text-gray-100 text-center">
            {t("login.guest.title")}
          </AppText>
          <AppText className="text-gray-300 text-center text-lg">
            {t("login.guest.description")}
          </AppText>
          <AppText className="text-center text-gray-300">
            {t("login.guest.testInfo")}
          </AppText>
          <View className="w-full">
            <GradientButton
              label={t("login.guest.continue")}
              onPress={() => {
                guestLogIn({
                  setLoadingMessage,
                  setLoading,
                  onSuccess: () => {},
                });
              }}
            />
          </View>
        </View>
      </ModalLogin>

      <FullScreenLoader visible={loading} message={loadingMessage} />
    </>
  );
}
