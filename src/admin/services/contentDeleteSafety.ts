export const ADMIN_CONTENT_DELETE_FLAG = 'VITE_ALLOW_ADMIN_CONTENT_DELETE';

export function isAdminContentDeleteAllowed(flagValue: unknown) {
  return flagValue === 'true';
}

export function getDeleteConfirmationPhrase(id: string) {
  return `DELETE ${id}`;
}

export function isDeleteConfirmationValid(input: string, id: string) {
  return input === getDeleteConfirmationPhrase(id);
}
