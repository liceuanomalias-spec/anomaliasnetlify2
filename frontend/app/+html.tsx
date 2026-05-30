// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-PT" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#166534" />
        <meta
          name="description"
          content="Relato de anomalias em instrumentos e espaços da Escola Secundária de Latino Coelho, Lamego."
        />
        <title>Relato de Anomalias · Escola Secundária de Latino Coelho</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }

              /* Mobile-first default: full screen */
              body > div:first-child {
                position: fixed !important;
                top: 0; left: 0; right: 0; bottom: 0;
                background: #FFFFFF;
              }

              /* Desktop: phone-shaped centered card */
              @media (min-width: 768px) {
                html, body { background: #F1F5F9 !important; }
                body::before {
                  content: "";
                  position: fixed;
                  inset: 0;
                  background:
                    radial-gradient(1200px 600px at 20% 0%, rgba(22,101,52,0.07), transparent 60%),
                    radial-gradient(1000px 600px at 100% 100%, rgba(22,101,52,0.05), transparent 60%),
                    #F1F5F9;
                  z-index: 0;
                }
                body > div:first-child {
                  position: fixed !important;
                  top: 50% !important;
                  left: 50% !important;
                  right: auto !important;
                  bottom: auto !important;
                  width: 100%;
                  max-width: 460px;
                  height: calc(100vh - 64px);
                  max-height: 920px;
                  transform: translate(-50%, -50%);
                  background: #FFFFFF;
                  border-radius: 28px;
                  box-shadow:
                    0 30px 80px -20px rgba(15, 23, 42, 0.25),
                    0 8px 24px -10px rgba(15, 23, 42, 0.12);
                  overflow: hidden;
                  z-index: 1;
                }

                /* Branding label outside the card (top-left) */
                body::after {
                  content: "Relato de Anomalias · Escola Secundária de Latino Coelho";
                  position: fixed;
                  top: 28px;
                  left: 32px;
                  font-size: 13px;
                  font-weight: 600;
                  color: #475569;
                  letter-spacing: 0.2px;
                  z-index: 2;
                }
              }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F9FAFB",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
