export function getUser() {
  // This will be replaced with actual Freebuff auth integration
  // For now, return a mock user for development
  const mockUser = {
    sub: 'user_12345',
    email: 'user@example.com',
    name: 'Test User',
  };
  
  return {
    data: mockUser,
    isLoading: false,
  };
}