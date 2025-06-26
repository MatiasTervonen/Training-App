"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";
import { russoOne } from "../ui/fonts";
import React from "react";
import LoginButton from "../ui/login/loginbutton";
import SignupButton from "../ui/login/signupbutton";
import GuestLogIn from "../components/GuestLogIn";

export default function LoginPage() {
  const [activeForm, setActiveForm] = useState(false);

  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = React.useActionState(signup, initialState);

  const [state2, formAction2] = React.useActionState(login, initialState);

  return (
    <>
      <div
        className={` ${russoOne.className} flex flex-col items-center h-[100dvh] w-full bg-blue-950 max-w-2xl mx-auto`}
      >
        <p className=" text-gray-100 text-5xl p-4 bg-gray-900 w-full text-center">
          MyTrack
        </p>
        <div className="relative flex flex-grow w-full overflow-hidden max-w-md">
          {/* Log in Form */}

          <form
            action={formAction2}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "-translate-y-full" : "translate-y-0"
            } flex flex-col justify-center h-full gap-5 p-10 bg-blue-950`}
          >
            <label
              className="text-gray-100 pointer-events-none"
              htmlFor="email-login"
            >
              Email:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="email-login"
              name="email"
              type="email"
              placeholder="Enter email..."
              autoComplete="username"
              required
            />
            <label
              className="text-gray-100 pointer-events-none"
              htmlFor="password-login"
            >
              Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="password-login"
              name="password"
              type="password"
              placeholder="Enter password..."
              autoComplete="current-password"
              required
            />
            <div className="flex flex-col">
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
            <div className="flex justify-center items-center mt-4">
              <GuestLogIn />
            </div>
          </form>

          {/* Sing Up Form */}

          <form
            action={formAction}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "translate-y-0" : "translate-y-full"
            } h-full flex flex-col justify-center gap-5 p-10 bg-blue-950 `}
          >
            <label
              className="text-gray-100 pointer-events-none"
              htmlFor="email-signup"
            >
              Email:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="email-signup"
              name="email"
              type="email"
              placeholder="Enter email..."
              autoComplete="email"
              required
            />
            <label
              className="text-gray-100 pointer-events-none"
              htmlFor="password-signup"
            >
              Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="password-signup"
              name="password"
              type="password"
              placeholder="Enter password..."
              autoComplete="new-password"
              required
            />
            <label
              className="text-gray-100 pointer-events-none"
              htmlFor="confirmPassword"
            >
              Confirm Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 bg-slate-900 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password..."
              autoComplete="new-password"
              required
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
        <div className="flex justify-center items-center w-full bg-blue-950 p-8 pb-20">
          <div className="flex flex-col items-center justify-center gap-10">
            <p className=" text-gray-100 text-center text-lg">
              {activeForm
                ? "Already have an account?"
                : "Don't have an account?"}
            </p>
            <button>
              <span
                className="text-gray-100 border-2 border-blue-400 py-4 px-10 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95"
                onClick={() => setActiveForm(!activeForm)}
              >
                {activeForm ? "Log in" : "Sign up"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
