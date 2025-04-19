"use client";

import { useState } from "react";
import { login, signup } from "@/app/login/actions";
import { russoOne } from "../ui/fonts";
import React from "react";
import LoginButton from "../ui/login/loginbutton";
import SignupButton from "../ui/login/signupbutton";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800">
        <div className="relative w-[350px] h-[500px] overflow-hidden">
          {/* Log in Form */}

          <form
            action={formAction2}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "-translate-y-full" : "translate-y-0"
            } h-full  flex flex-col gap-5 p-10 bg-blue-950 rounded-xl shadow-lg border-2 border-b-0 rounded-b-none border-blue-500`}
          >
            <label
              className={`${russoOne.className} text-gray-100 font-bold `}
              htmlFor="email"
            >
              Email:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="email"
              name="email"
              type="email"
              placeholder="Enter email..."
              required
            />
            <label
              className={`${russoOne.className} text-gray-100 font-bold `}
              htmlFor="password"
            >
              Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="password"
              name="password"
              type="password"
              placeholder="Enter password..."
              required
            />
            <div className="flex flex-col gap-4">
              <LoginButton />
              {state2.message && (
                <p
                  className={`mt-4 text-sm font-semibold ${
                    state2.success ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {state2.message}
                </p>
              )}
            </div>
          </form>

          {/* Sing Up Form */}

          <form
            action={formAction}
            className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
              activeForm ? "translate-y-0" : "translate-y-full"
            } h-full flex flex-col gap-5 p-10 bg-blue-950 rounded-xl shadow-lg border-2 border-b-0 rounded-b-none border-blue-500`}
          >
            <label
              className={`${russoOne.className} text-gray-100 font-bold `}
              htmlFor="email"
            >
              Email:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="email"
              name="email"
              type="email"
              placeholder="Enter email..."
              required
            />
            <label
              className={`${russoOne.className} text-gray-100 font-bold `}
              htmlFor="password"
            >
              Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="password"
              name="password"
              type="password"
              placeholder="Enter password..."
              required
            />
            <label
              className={`${russoOne.className} text-gray-100 font-bold `}
              htmlFor="confirmPassword"
            >
              Confirm Password:
            </label>
            <input
              className="custom-login-input border-2 rounded-md text-gray-100 p-2 hover:border-blue-500 focus:outline-none focus:border-green-300"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password..."
              required
            />
            <div className="flex flex-col gap-4">
              <SignupButton />
              {state.message && (
                <p
                  className={`mt-4 text-sm font-semibold ${
                    state.success ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {state.message}
                </p>
              )}
            </div>
          </form>
        </div>
        <div className="flex justify-center items-center w-[350px] bg-blue-500 p-8 rounded-b-md shadow-lg border-2 border-blue-500">
          <button>
            <span
              className={`${russoOne.className} text-gray-100 font-bold border-b-3 border-l-3 border-blue-950 p-4 rounded-md bg-blue-900 hover:bg-blue-800 hover:scale-95`}
              onClick={() => setActiveForm(!activeForm)}
            >
              {activeForm ? "Log in" : "Sign up"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
