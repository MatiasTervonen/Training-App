"use client";

import { useEffect, useState, useTransition } from "react";
import {
  login,
  signup,
  sendPasswordResetEmail,
  resendEmailVerification,
} from "@/app/login/actions";
import React from "react";
import LoginButton from "@/app/login/components/loginbutton";
import SignupButton from "@/app/login/components/signupbutton";
import ModalLogin from "@/app/login/components/modalLogin";
import CustomInput from "@/ui/CustomInput";
import ResetPasswordButton from "@/app/login/components/resetPasswordButton";
import ResendButton from "@/app/login/components/resendButton";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { guestLogin } from "@/app/login/guest-login/action";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useTranslation } from "react-i18next";

const ConfettiAnimation = dynamic(() => import("../components/confetti"), {
  ssr: false,
});

export default function LoginPage() {
  const { t } = useTranslation("login");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const [activeForm, setActiveForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modal2Open, setModal2Open] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [hideErrorMessage, setHideErrorMessage] = useState(false);
  const router = useRouter();

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = React.useActionState(signup, initialState);

  const [state2, formAction2] = React.useActionState(login, initialState);

  const [state3, formAction3] = React.useActionState(
    sendPasswordResetEmail,
    initialState,
  );

  const [state4, formAction4] = React.useActionState(
    resendEmailVerification,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSignUpSuccess(true);
    }
  }, [state.success]);

  return (
    <div className="bg-slate-950">
      {signUpSuccess && (
        <div className="fixed inset-0 z-100 pointer-events-none">
          <ConfettiAnimation />
        </div>
      )}
      <div className="flex flex-col items-center h-dvh w-full bg-linear-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-7xl mx-auto">
        <nav className="flex items-center justify-between w-full py-4 px-2">
          <button
            className="flex items-center gap-2 hover:scale-105 hover:text-teal-500 transition-transform duration-200 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <ArrowLeft size={30} />
            <p>{t("login.back")}</p>
          </button>
          <p className="text-3xl sm:text-4xl lg:text-5xl text-center bg-linear-to-tr from-[#27aee4] via-[#66ece1] to-[#f3f18d] text-transparent bg-clip-text">
            MyTrack
          </p>
          <p className="min-w-[76px]"></p>
        </nav>
        <div className="relative flex grow w-full overflow-hidden max-w-md">
          {/* Log in Form */}

          <form
            action={formAction2}
            onSubmit={() => setHideErrorMessage(false)}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "-translate-y-full" : "translate-y-0"
            } flex flex-col justify-center h-full gap-5 px-10`}
          >
            <CustomInput
              className="custom-login-input"
              id="email-login"
              name="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              autoComplete="email"
              required
              label={`${t("login.email")}:`}
              maxLength={128}
              onChange={() => setHideErrorMessage(true)}
            />
            <CustomInput
              className="custom-login-input"
              id="password-login"
              name="password"
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="current-password"
              required
              label={`${t("login.password")}:`}
              maxLength={128}
              onChange={() => setHideErrorMessage(true)}
            />
            <div className="flex flex-col ">
              <LoginButton />
              <p
                aria-live="polite"
                className={`mt-4 text-sm text-center min-h-5  ${
                  state2.message
                    ? state2.success
                      ? "text-green-500"
                      : "text-red-500"
                    : "invisible"
                }`}
              >
                {!hideErrorMessage && state2.message}
              </p>
              {state2.message ===
                "Please verify your email before logging in." && (
                <p
                  onClick={() => setModal2Open(true)}
                  className="cursor-pointer text-center hover:underline mt-2"
                >
                  {t("login.resendEmail.didntGetEmail")}
                </p>
              )}
            </div>

            {/*  Guest login button */}

            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => setGuestModalOpen(true)}
                className="flex items-center justify-center gap-2 px-10  border-2 border-blue-500 p-2 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200 cursor-pointer"
                disabled={isPending}
              >
                <span>{t("login.logInAsGuest")}</span>
              </button>
              <div className="h-6">
                {error && (
                  <p className="text-red-500 pt-5 text-center text-sm">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <p
              onClick={() => setModalOpen(true)}
              className="cursor-pointer text-center hover:underline"
            >
              {t("login.forgotPassword.link")}
            </p>
          </form>

          <ModalLogin
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
            }}
          >
            {/* Forgot Password Form */}

            <form
              action={formAction3}
              onSubmit={() => setHideErrorMessage(false)}
              className="flex flex-col justify-between items-center p-8 text-center gap-5 h-full"
            >
              <div className="flex flex-col gap-5 ">
                <h3 className="text-xl underline mt-5 text-gray-100">
                  {t("login.forgotPassword.title")}
                </h3>
                <p className="text-gray-300">
                  {t("login.forgotPassword.description")}
                </p>
                <div className="w-full">
                  <CustomInput
                    className="custom-login-input"
                    id="email-forgot-password"
                    name="email"
                    type="email"
                    placeholder={t("login.emailPlaceholder")}
                    spellCheck={false}
                    required
                    maxLength={128}
                    onChange={() => {
                      setHideErrorMessage(true);
                    }}
                  />
                  <p
                    aria-live="polite"
                    className={`mt-4 text-sm text-center min-h-5 ${
                      state3.message
                        ? state3.success
                          ? "text-green-500"
                          : "text-red-500"
                        : "invisible"
                    }`}
                  >
                    {!hideErrorMessage && state3.message}
                  </p>
                </div>
              </div>

              <ResetPasswordButton />
            </form>
          </ModalLogin>

          {/* Sign Up Form */}
          <form
            action={formAction}
            onSubmit={() => setHideErrorMessage(false)}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "translate-y-0" : "translate-y-full"
            } h-full flex flex-col justify-center gap-5 p-10`}
          >
            <CustomInput
              className="custom-login-input"
              id="email-signup"
              name="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              autoComplete="email"
              required
              label={`${t("login.email")}:`}
              maxLength={128}
              onChange={() => setHideErrorMessage(true)}
            />
            <CustomInput
              className="custom-login-input"
              id="password-signup"
              name="password"
              type="password"
              placeholder={t("login.passwordPlaceholder")}
              autoComplete="new-password"
              required
              label={`${t("login.password")}:`}
              maxLength={128}
              onChange={() => setHideErrorMessage(true)}
            />
            <CustomInput
              className="custom-login-input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("login.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              required
              label={`${t("login.confirmPassword")}:`}
              maxLength={128}
              onChange={() => setHideErrorMessage(true)}
            />
            <div className="flex flex-col gap-4">
              <SignupButton />
              <p
                aria-live="polite"
                className={`my-2 text-sm text-center min-h-5 ${
                  !state.success ? "text-red-500" : "invisible"
                }`}
              >
                {!hideErrorMessage && state.message}
              </p>
              {state.success && (
                <p
                  onClick={() => setModal2Open(true)}
                  className="cursor-pointer text-center hover:underline"
                >
                  {t("login.resendEmail.didntGetEmail")}
                </p>
              )}
            </div>
          </form>

          {/* Success modal */}

          {state.success && (
            <ModalLogin
              isOpen={signUpSuccess}
              onClose={() => {
                setSignUpSuccess(false);
              }}
              className="backdrop-blur-sm"
            >
              <div className="flex flex-col items-center px-6 py-10 pb-10 justify-between h-full text-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl text-center bg-linear-to-tr from-[#27aee4] via-[#66ece1] to-[#f3f18d] text-transparent bg-clip-text">
                  MyTrack
                </h1>
                <h3 className="text-xl  mt-5">{t("login.signUpSuccess.title")}</h3>
                <p className="text-green-500 ">{t("login.signUpSuccess.message")}</p>

                <p
                  onClick={() => setModal2Open(true)}
                  className="cursor-pointer hover:underline"
                >
                  {t("login.resendEmail.didntGetEmail")}
                </p>
              </div>
            </ModalLogin>
          )}

          {/* Resend Verification Email Form */}

          <ModalLogin
            isOpen={modal2Open}
            onClose={() => {
              setModal2Open(false);
            }}
          >
            <form
              action={formAction4}
              className="flex flex-col justify-between items-center p-10 text-center gap-5 h-full"
            >
              <div className="flex flex-col gap-5">
                <h3 className="text-xl underline mt-5">
                  {t("login.resendEmail.title")}
                </h3>
                <p className="text-gray-300">
                  {t("login.resendEmail.description")}
                </p>
                <div className="w-full">
                  <CustomInput
                    className="custom-login-input"
                    id="email-resend-verification"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("login.emailPlaceholder")}
                    required
                    maxLength={128}
                  />
                  <p
                    aria-live="polite"
                    className={`mt-4 text-sm text-center min-h-5 ${
                      state4.message
                        ? state4.success
                          ? "text-green-500"
                          : "text-red-500"
                        : "invisible"
                    }`}
                  >
                    {state4.message}
                  </p>
                </div>
              </div>
              <ResendButton />
            </form>
          </ModalLogin>

          {/* Guest login modal */}

          <ModalLogin
            isOpen={guestModalOpen}
            onClose={() => setGuestModalOpen(false)}
          >
            <div className="flex flex-col justify-between h-full py-10 px-4 sm:px-10 items-center z-100 w-full">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl text-center bg-linear-to-tr from-[#27aee4] via-[#66ece1] to-[#f3f18d] text-transparent bg-clip-text">
                MyTrack
              </h1>
              <div className="flex flex-col text-center gap-10">
                <h2 className="text-2xl underline">{t("login.guest.title")}</h2>
                <p className="text-lg">
                  {t("login.guest.description")}
                </p>
                <p>{t("login.guest.testInfo")}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    setError(null);
                    const result = await guestLogin();
                    if (!result.success) {
                      setError(result.message ?? t("login.actions.guestLoginError"));
                      setGuestModalOpen(false);
                    }
                  })
                }
                className="w-full border-2 border-blue-500 p-2 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition duration-200 cursor-pointer"
                disabled={isPending}
              >
                <span>{t("login.guest.continue")}</span>
              </button>
            </div>
          </ModalLogin>
          {isPending && <FullScreenLoader message={t("login.actions.loggingInAsGuest")} />}
        </div>
        <div className="flex justify-center items-center w-full  pb-10">
          <div className="flex flex-col items-center justify-center gap-5">
            <p className="text-center text-lg">
              {activeForm
                ? t("login.alreadyHaveAccount")
                : t("login.dontHaveAccount")}
            </p>
            <button
              onClick={() => {
                setActiveForm(!activeForm);
                setHideErrorMessage(true);
              }}
              className="border-2 border-blue-400 py-2 px-10 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {activeForm ? t("login.logIn") : t("login.signUp")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
