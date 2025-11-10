import TemplateForm from "@/app/(app)/training/components/TemplateForm";
import { getFullTemplate } from "@/app/(app)/database/template";
import { full_gym_template } from "@/app/(app)/types/models";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session!: full_gym_template;
  let errorMessage = "";

  try {
    session = await getFullTemplate(id);
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "Failed to load template.";
    }
  }

  return <TemplateForm initialData={session} errorMessage={errorMessage} />;
}
