import { List } from "lucide-react";
import LinkButton from "@/app/(app)/components/buttons/LinkButton";

export default function Sessions() {
  return (
    <div className="page-padding min-h-full max-w-md mx-auto">
      <h1 className="text-center mb-10 text-2xl ">Todo</h1>
      <div className="flex flex-col gap-5">
        <LinkButton href="/todo/create-todo">Create Todo List</LinkButton>

        <LinkButton href="/todo/my-todo-lists">
          My Todo Lists
          <List />
        </LinkButton>
      </div>
    </div>
  );
}
