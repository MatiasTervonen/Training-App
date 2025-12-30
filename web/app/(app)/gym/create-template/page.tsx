import TemplateForm from "@/app/(app)/gym/components/template/TemplateForm";

export default function CreateTemplatePage() {
  const emptySession = {
    id: "",
    user_id: "",
    name: "",
    updated_at: "",
    created_at: new Date().toISOString(),
    gym_template_exercises: [],
  };

  return <TemplateForm initialData={emptySession} errorMessage="" />;
}
