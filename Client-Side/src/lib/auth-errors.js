const DEFAULT_ERROR_DESCRIPTION =
  "Some details weren't accepted. Check the fields and try again.";

const extractMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  return error?.response?.data?.message || error?.message || "";
};

export const describeAuthError = (
  error,
  {
    title = "Request failed",
    conflictTitle = "Account already exists",
    conflictDescription =
      "An account with this email already exists. Sign in instead.",
    fallbackDescription = DEFAULT_ERROR_DESCRIPTION,
  } = {}
) => {
  const message = extractMessage(error);
  const normalizedMessage = message.toLowerCase();

  if (
    error?.response?.status === 409 ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("duplicate field")
  ) {
    return {
      title: conflictTitle,
      description: message || conflictDescription,
    };
  }

  return {
    title,
    description: message || fallbackDescription,
  };
};
