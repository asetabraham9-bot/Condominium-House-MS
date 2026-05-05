import { User, mockUsers } from "./mockData";

// Mock authentication context
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem("currentUser");
  if (!userJson) return null;
  return JSON.parse(userJson);
}

export function login(email: string, password: string): User | null {
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem("currentUser");
}

export function register(userData: Partial<User>): User {
  const newUser: User = {
    id: Date.now().toString(),
    email: userData.email || "",
    password: userData.password || "",
    role: userData.role || "applicant",
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    phone: userData.phone,
  };
  
  // In a real app, this would save to database
  mockUsers.push(newUser);
  localStorage.setItem("currentUser", JSON.stringify(newUser));
  
  return newUser;
}
