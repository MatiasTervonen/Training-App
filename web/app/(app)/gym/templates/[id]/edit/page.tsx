import TemplateForm from "@/app/(app)/gym/components/template/TemplateForm";
import { getFullTemplate } from "@/app/(app)/database/gym/templates/full-gym-template";
import { full_gym_template } from "@/app/(app)/types/models";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let template!: full_gym_template;
  let errorMessage = "";

  try {
    template = (await getFullTemplate(id)) as full_gym_template;
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "Failed to load template.";
    }
  }

  return <TemplateForm initialData={template} errorMessage={errorMessage} />;
}
