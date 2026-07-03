import React from "react";
import FacebookLogin from "@greatsumini/react-facebook-login";

// Mirrors GoogleAuthButton's visual treatment exactly — neutral dark pill
// with a single brand-color accent on the glyph. Per the user's design
// preference we do NOT use the brand-mandated full-blue Facebook button
// (Meta's brand guidelines suggest #1877F2 fill, which would clash with
// the editorial dark theme).

const FacebookGlyph = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#1877F2"
      d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.062 4.388 23.027 10.125 23.927v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

const FacebookAuthButton = ({
  onSuccess,
  onError,
  disabled,
  label = "Quick Access with Facebook",
}) => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Mirror Google: render nothing if env not configured, so the button
  // doesn't render disabled/broken in environments without Meta creds.
  if (!appId) return null;

  return (
    <FacebookLogin
      appId={appId}
      scope="public_profile,email"
      onSuccess={(response) => {
        // FB SDK returns { accessToken, userID }. Normalize to the same
        // shape as Google's callback so both buttons feed the parent
        // handler identically.
        if (onSuccess) {
          onSuccess({
            access_token: response?.accessToken,
            userID: response?.userID,
          });
        }
      }}
      onFail={(err) => {
        if (onError) onError(err);
      }}
      render={({ onClick }) => (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="
            group w-full h-12
            bg-card hover:bg-elevated active:bg-panel
            text-ink-2
            border border-line hover:border-muted
            flex items-center justify-center gap-3
            transition-colors duration-200
            disabled:opacity-50 disabled:pointer-events-none
            focus:outline-none focus:ring-2 focus:ring-gold-ink/40 focus:ring-offset-2 focus:ring-offset-page
          "
        >
          <FacebookGlyph size={18} />
          <span className="se-label text-[11px] tracking-[0.18em]">
            {label}
          </span>
        </button>
      )}
    />
  );
};

export default FacebookAuthButton;
