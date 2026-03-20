import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface ConfirmationEmailProps {
  confirmationUrl: string;
}

export const ConfirmationEmail = ({
  confirmationUrl,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email address</Preview>
    <Body style={body}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://kurvi.io/app-logos/kurvi_ice_blue_final_copnverted.png"
            width="140"
            height="auto"
            alt="Kurvi"
            style={logo}
          />
        </Section>

        <Section style={content}>
          <Heading style={heading}>Confirm your email</Heading>
          <Text style={paragraph}>
            Thanks for signing up! Click the button below to confirm your email
            address and get started.
          </Text>

          <Section style={buttonContainer}>
            <Button href={confirmationUrl} style={button}>
              Confirm Email
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            If you didn&apos;t create an account, you can safely ignore this
            email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const body: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "0",
};

const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "40px 0",
  borderRadius: "12px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "0",
  padding: "32px 0",
  textAlign: "center" as const,
};

const logo: React.CSSProperties = {
  margin: "0 auto",
};

const content: React.CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "0 0 12px 12px",
  padding: "40px 48px",
};

const heading: React.CSSProperties = {
  color: "#f9fafb",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const paragraph: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 32px",
  textAlign: "center" as const,
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 32px",
};

const button: React.CSSProperties = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
};

const divider: React.CSSProperties = {
  borderColor: "#374151",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "0",
};
