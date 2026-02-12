import LinkButton from "./components/buttons/LinkButton";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Page Not Found</h1>
      <p className="mb-4">The page you are looking for does not exist.</p>
      <LinkButton href="/">Go to Home</LinkButton>
    </div>
  );
}
