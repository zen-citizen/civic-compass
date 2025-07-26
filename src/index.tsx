import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PostHogProvider } from "posthog-js/react";
import App from "./App";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};

const elRoot = document.getElementById("root");
if (elRoot) {
  const root = createRoot(elRoot);
  root.render(
    <StrictMode>
      <PostHogProvider
        apiKey={import.meta.env.REACT_APP_PUBLIC_POSTHOG_KEY}
        options={options}
      >
        <App />
      </PostHogProvider>
    </StrictMode>
  );
}
