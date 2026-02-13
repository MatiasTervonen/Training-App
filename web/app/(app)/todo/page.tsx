"use client";

import { List } from "lucide-react";
import LinkButton from "@/components/buttons/LinkButton";
import { useTranslation } from "react-i18next";

export default function Sessions() {
  const { t } = useTranslation("todo");

  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">{t("todo.title")}</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/todo/create-todo">
          {t("todo.createTodoList")}
        </LinkButton>

        <LinkButton href="/todo/my-todo-lists">
          {t("todo.myTodoLists")}
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
