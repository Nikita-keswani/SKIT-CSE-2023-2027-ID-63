import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com";

// Renders Google's own "Sign in with Google" button and hands the
// resulting credential (a signed ID token) back to onSuccess.
export default function GoogleLoginButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      /* global google */
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            onError?.("No credential returned from Google");
          }
        },
      });
      google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [onSuccess, onError]);

  return <div ref={buttonRef} />;
}