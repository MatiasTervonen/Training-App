import LayoutWrapper from "./ui/LayoutWrapper";
import { Toaster } from "react-hot-toast";
import "../globals.css";
import ChatButton from "./components/ChatButton";

export default function appLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} />
      <LayoutWrapper>{children}</LayoutWrapper>
      <ChatButton />
    </div>
  );
}
