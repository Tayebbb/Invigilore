// Utility functions for safe API response handling
export function extractApiData(response: any) {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return null;
}

export function extractApiError(error: any) {
  if (error?.response?.data?.errors) return error.response.data.errors;
  if (error?.response?.data?.message) return error.response.data.message;
  return error?.message || 'Unknown error';
}
