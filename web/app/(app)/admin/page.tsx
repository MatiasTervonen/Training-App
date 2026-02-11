"use client";

import { useTranslation } from "react-i18next";
import LinkButton from "../components/buttons/LinkButton";

export default function AdminPage() {
  const { t } = useTranslation("common");

  return (
    <div className="max-w-md mx-auto page-padding">
      <h1 className="text-2xl mb-10 text-center">{t("admin.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href={"/admin/user-analytics"}>
          {t("admin.userAnalytics")}
        </LinkButton>
        <LinkButton href={"/admin/add-exercises"}>
          {t("admin.addExercises")}
        </LinkButton>
        <LinkButton href={"/admin/edit-exercises"}>
          {t("admin.editExercises")}
        </LinkButton>
        <LinkButton href={"/admin/docs"}>
          {t("admin.devDocs")}
        </LinkButton>
      </div>
    </div>
  );
}
