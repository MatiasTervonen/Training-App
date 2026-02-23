"use client";

import { useFormStatus } from "react-dom";
import { useTranslation } from "react-i18next";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function LoginButton() {
  const { t } = useTranslation("login");
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        className=" cursor-pointer text-gray-100 border-2 border-blue-500 p-2 rounded-md bg-linear-to-tr from-slate-950  to-blue-700 hover:from-blue-700 hover:to-slate-950 transform hover:scale-105 transition-all duration-200"
        disabled={pending}
      >
        {t("login.logIn")}
      </button>
      {pending && <FullScreenLoader message={t("login.actions.loggingIn")} />}
    </>
  );
}
