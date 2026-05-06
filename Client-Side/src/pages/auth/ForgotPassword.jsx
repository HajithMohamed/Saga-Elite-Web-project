import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { forgotPasswordAction } from "@/store/auth-slice";
import { toast } from "@/hooks/use-toast";
import { Btn, Eyebrow, FieldError, AUTH_INPUT, AUTH_PRIMARY_BTN } from "@/components/ui/editorial";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email, touched) => {
  if (touched && !email) return "Tell us where to send the code.";
  if (email && !EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  return "";
};

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setError(validateEmail(email, touched));
  }, [email, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const fresh = validateEmail(email, true);
    setError(fresh);
    if (fresh) return;
    setIsLoading(true);
    try {
      const response = await dispatch(forgotPasswordAction({ email })).unwrap();
      toast({
        title: "Code sent",
        description: response.message || "Check your inbox for a four-digit code.",
        variant: "success",
      });
      navigate("/auth/reset-password-otp", { state: { email } });
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err.message || "Could not send the code.";
      toast({ title: "Request failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Eyebrow tone="gold" size="md">Forgotten</Eyebrow>
      <h1 className="mt-4 se-serif text-[#e5e2e1] leading-[1.0] text-4xl md:text-6xl">
        Reset your<br />password.
      </h1>
      <p className="mt-5 se-body text-sm md:text-base text-[#d0c5af] leading-relaxed max-w-md">
        Tell us the email tied to your account. We'll send a four-digit code to confirm it's
        you.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-10 md:mt-12 space-y-6">
        <div>
          <Eyebrow tone="muted" size="xs">Email</Eyebrow>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="your.name@email.com"
            aria-invalid={Boolean(touched && error)}
            className={`mt-2 ${AUTH_INPUT} ${touched && error ? "border-[#ffb4ab] focus:border-[#ffb4ab]" : ""}`}
          />
          <FieldError>{touched ? error : null}</FieldError>
        </div>

        <Btn
          variant="default"
          className={AUTH_PRIMARY_BTN}
          iconRight={ArrowRight}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Sending code" : "Send the code"}
        </Btn>
      </form>

      <Link
        to="/auth/login"
        className="mt-12 inline-flex items-center gap-2 se-label text-[10px] tracking-[0.28em] text-[#99907c] hover:text-[#f2ca50] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to sign in
      </Link>
    </div>
  );
};

export default ForgotPassword;
