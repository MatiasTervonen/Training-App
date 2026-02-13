// components/RichContent.tsx
import { useState } from "react";
import { WebView } from "react-native-webview";

type RichContentProps = {
  html: string;
};

export default function RichContent({ html }: RichContentProps) {
  const [height, setHeight] = useState(300);

  return (
    <WebView
      source={{
        html: `
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { overflow: hidden; }
            body { 
              color: #e5e7eb; 
              font-size: 15px; 
              line-height: 1.6; 
              margin: 0; 
              padding: 8px;
              background: transparent; 
            }
            p { margin-bottom: 12px; }
            h1, h2, h3 { color: #fff; margin-bottom: 10px; }
            ul, ol { padding-left: 20px; margin-bottom: 12px; }
            blockquote {
              border-left: 3px solid #4b5563;
              padding-left: 12px;
              margin: 12px 0;
              color: #9ca3af;
            }
            code {
              background: #1e293b;
              color: #e2e8f0;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 13px;
            }
            pre {
              background: #1e293b;
              padding: 14px;
              border-radius: 8px;
              overflow-x: auto;
              margin-bottom: 12px;
            }
            pre code {
              background: none;
              padding: 0;
              display: block;
             white-space: pre-wrap;
            word-break: break-all;
            }
            a { color: #60a5fa; }
            img { max-width: 100%; height: auto; }
          </style>
          ${html}
          <script>
            function sendHeight() {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ height: document.body.scrollHeight })
              );
            }
            sendHeight();
            new ResizeObserver(sendHeight).observe(document.body);
          </script>
        `,
      }}
      style={{ height, backgroundColor: "transparent" }}
      scrollEnabled={false}
      originWhitelist={["*"]}
      onMessage={(e) => {
        const { height } = JSON.parse(e.nativeEvent.data);
        setHeight(height);
      }}
    />
  );
}
