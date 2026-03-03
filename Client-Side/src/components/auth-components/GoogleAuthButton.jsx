import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

// This component must only be rendered inside a <GoogleOAuthProvider>.
// Keeping useGoogleLogin here means the hook is never called without a valid provider.
const GoogleAuthButton = ({ onSuccess, onError, disabled }) => {
  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess,
    onError,
  });

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => googleLogin()}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 border-gray-500 text-gray-200"
    >
      <FcGoogle className="h-5 w-5" />
      Continue with Google
    </Button>
  );
};

export default GoogleAuthButton;
