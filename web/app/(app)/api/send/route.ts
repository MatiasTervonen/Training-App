import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { to, subject, html } = await req.json();

  const { data, error } = await resend.emails.send({
    from: "no-reply@mail.kurvi.io",
    to,
    subject,
    html,
  });

  if (error) return Response.json({ error }, { status: 400 });
  return Response.json(data);
}
