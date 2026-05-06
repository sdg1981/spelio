export function browserLooksOkay() {
  return (
    typeof window !== 'undefined' &&
    'localStorage' in window &&
    'fetch' in window &&
    'Audio' in window
  );
}
