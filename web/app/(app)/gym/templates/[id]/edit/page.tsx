import TemplateForm from "@/features/gym/components/template/TemplateForm";
import { getFullTemplate } from "@/database/gym/templates/full-gym-template";
import { FullGymTemplate } from "@/database/gym/templates/full-gym-template";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let template!: FullGymTemplate;
  let errorMessage = "";

  try {
    template = (await getFullTemplate(id)) as FullGymTemplate;
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "Failed to load template.";
    }
  }

  return <TemplateForm initialData={template} errorMessage={errorMessage} />;
}
