// API configuration and utilities for S-Emulator server
const API_BASE_URL = 'http://localhost:8080/S-emulator/api';

export interface User {
  username: string;
  [key: string]: any;
}

export interface Program {
  name: string;
  expansionLevel?: number;
  statistics?: {
    cycles?: number;
    [key: string]: any;
  };
  instructions?: Instruction[];
  variables?: Record<string, any>;
  architectureCompatible?: string[];
}

export interface Instruction {
  id: number;
  label?: string;
  opcode: string;
  operands: string[];
  cycles: number;
}

export interface ExecutionState {
  instructions?: Instruction[];
  variables?: Record<string, any>;
  currentInstructionId?: number;
  cycleCounter?: number;
  architectureCompatible?: string[];
  finished?: boolean;
}

// Helper to make authenticated requests
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// User API
export async function registerUser(username: string): Promise<void> {
  const encodedUsername = encodeURIComponent(username.trim());
  await fetchAPI('/user', {
    method: 'POST',
    body: JSON.stringify({ username: encodedUsername }),
  });
}

export async function fetchUser(username: string): Promise<User> {
  const encodedUsername = encodeURIComponent(username.trim());
  return await fetchAPI(`/user?username=${encodedUsername}`);
}

// Programs API
export async function fetchPrograms(): Promise<Program[]> {
  return await fetchAPI('/programs');
}

export async function fetchProgram(programName: string): Promise<Program> {
  const encodedName = encodeURIComponent(programName);
  return await fetchAPI(`/programs/${encodedName}`);
}

// Execution API
export async function startExecution(programName: string): Promise<void> {
  await fetchAPI('/execution/start', {
    method: 'POST',
    body: JSON.stringify({ program: programName }),
  });
}

export async function fetchExecutionState(): Promise<ExecutionState> {
  return await fetchAPI('/execution/state');
}

export async function stopExecution(): Promise<void> {
  await fetchAPI('/execution/stop', {
    method: 'POST',
  });
}

// Cookie utilities
export function setUsernameCookie(username: string) {
  const encodedUsername = encodeURIComponent(username);
  document.cookie = `username=${encodedUsername}; path=/; max-age=86400`; // 24 hours
}

export function getUsernameCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)username=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteUsernameCookie() {
  document.cookie = 'username=; path=/; max-age=0';
}
