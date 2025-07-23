import LayoutWrapper from "./components/LayoutWrapper";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
