/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (typeof errors === "object") {
      const firstError = Object.values(errors)[0];
      return firstError || "Request failed";
    }
    return "Request failed";
  }

  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};

/**
 * Get all validation errors from API response
 */
export const getErrorFields = (error) => {
  if (error?.response?.data?.errors && typeof error.response.data.errors === "object") {
    return error.response.data.errors;
  }
  return {};
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  return error?.response?.status === 400 && error?.response?.data?.errors;
};

/**
 * Check if error is an auth error
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error) => {
  return error?.response?.status === 404;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error) => {
  return error?.response?.status >= 500;
};
