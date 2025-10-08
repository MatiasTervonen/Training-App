"use client";

import { useState } from "react";
import { login, signup, sendPasswordResetEmail } from "@/app/login/actions";
import React from "react";
import LoginButton from "@/app/login/components/loginbutton";
import SignupButton from "@/app/login/components/signupbutton";
import GuestLogIn from "@/app/login/guest-login/quest-login";
import ModalForgotPassword from "../(app)/components/modalForgotPasword";
import CustomInput from "../(app)/ui/CustomInput";
import ResetPasswordButton from "./components/resetPasswordButton";

export default function LoginPage() {
  const [activeForm, setActiveForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = React.useActionState(signup, initialState);

  const [state2, formAction2] = React.useActionState(login, initialState);

  const [state3, formAction3] = React.useActionState(
    sendPasswordResetEmail,
    initialState
  );

  return (
    <div className="bg-slate-950">
      <div className="flex flex-col items-center h-[100dvh] w-full bg-gradient-to-tr from-slate-950 via-slate-950 to-blue-900 max-w-7xl mx-auto">
        <p className=" text-gray-100 text-5xl p-4 w-full text-center">
          MyTrack
        </p>
        <div className="relative flex flex-grow w-full overflow-hidden max-w-md">
          {/* Log in Form */}

          <form
            action={formAction2}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "-translate-y-full" : "translate-y-0"
            } flex flex-col justify-center h-full gap-5 px-10`}
          >
            <CustomInput
              className="custom-login-input"
              id="email-login"
              name="email"
              type="email"
              placeholder="Enter email..."
              autoComplete="email"
              required
              label="Email:"
            />
            <CustomInput
              className="custom-login-input"
              id="password-login"
              name="password"
              type="password"
              placeholder="Enter password..."
              autoComplete="current-password"
              required
              label="Password:"
            />
            <div className="flex flex-col ">
              <LoginButton />
              <p
                aria-live="polite"
                className={`mt-4 text-sm text-center ${
                  state2.message
                    ? state2.success
                      ? "text-green-500"
                      : "text-red-500"
                    : "text-transparent"
                }`}
              >
                {state2.message || "Placeholder for message"}
              </p>
            </div>
            <div>
              <GuestLogIn />
            </div>
            <p
              onClick={() => setModalOpen(true)}
              className="text-gray-100 cursor-pointer text-center hover:underline"
            >
              Forgot password?
            </p>
          </form>

          <ModalForgotPassword
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEmail("");
              state3.message = "";
            }}
          >
            {/* Forgot Password Form */}

            <form
              action={formAction3}
              className="flex flex-col justify-between items-center p-10 text-center gap-5 h-full"
            >
              <div className="flex flex-col gap-5">
                <h3 className="text-xl underline mt-5 text-gray-100">
                  Reset your password
                </h3>
                <p className="text-gray-300">
                  Enter your email and we&apos;ll send you a link to reset your
                  password.
                </p>
                <div className="w-full">
                  <CustomInput
                    className="custom-login-input"
                    value={email}
                    setValue={setEmail}
                    id="email-forgot-password"
                    name="email"
                    type="email"
                    placeholder="Enter email..."
                    required
                  />
                  <p
                    aria-live="polite"
                    className={`mt-4 text-sm text-center ${
                      state3.message
                        ? state3.success
                          ? "text-green-500"
                          : "text-red-500"
                        : "text-transparent"
                    }`}
                  >
                    {state3.message || "Placeholder for message"}
                  </p>
                </div>
              </div>
              <ResetPasswordButton />
            </form>
          </ModalForgotPassword>

          {/* Sign Up Form */}
          <form
            action={formAction}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "translate-y-0" : "translate-y-full"
            } h-full flex flex-col justify-center gap-5 p-10`}
          >
            <CustomInput
              className="custom-login-input"
              id="email-signup"
              name="email"
              type="email"
              placeholder="Enter email..."
              autoComplete="email"
              required
              label="Email:"
            />
            <CustomInput
              className="custom-login-input"
              id="password-signup"
              name="password"
              type="password"
              placeholder="Enter password..."
              autoComplete="new-password"
              required
              label="Password:"
            />
            <CustomInput
              className="custom-login-input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password..."
              autoComplete="new-password"
              required
              label="Confirm Password:"
            />
            <div className="flex flex-col gap-4">
              <SignupButton />
              <p
                aria-live="polite"
                className={`mt-4 text-sm text-center  ${
                  state.message
                    ? state.success
                      ? "text-green-500"
                      : "text-red-500"
                    : "text-transparent"
                }`}
              >
                {state.message || "Placeholder for message"}
              </p>
            </div>
          </form>
        </div>
        <div className="flex justify-center items-center w-full  pb-10">
          <div className="flex flex-col items-center justify-center gap-5">
            <p className=" text-gray-100 text-center text-lg">
              {activeForm
                ? "Already have an account?"
                : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setActiveForm(!activeForm);
              }}
              className="text-gray-100 border-2 border-blue-400 py-2 px-10 rounded-md bg-gradient-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200"
            >
              {activeForm ? "Log in" : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
