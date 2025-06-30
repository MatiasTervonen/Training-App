import LayoutWrapper from "./ui/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import "../globals.css";

export default function appLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      <LayoutWrapper>{children}</LayoutWrapper>
    </div>
  );
}
