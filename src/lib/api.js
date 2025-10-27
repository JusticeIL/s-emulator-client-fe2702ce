const API_BASE_URL = 'http://localhost:8080/S-emulator/api';

// Helper function to make API requests
export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  return response;
}

// User Management
export async function registerUser(username) {
  const response = await fetchAPI('/user', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
  return response;
}

export async function fetchUser(username) {
  const response = await fetchAPI(`/user?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// Programs
export async function fetchPrograms() {
  const response = await fetchAPI('/programs');
  if (!response.ok) {
    throw new Error('Failed to fetch programs');
  }
  return response.json();
}

export async function fetchProgram(programName) {
  const response = await fetchAPI(`/programs/${encodeURIComponent(programName)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch program');
  }
  return response.json();
}

// Execution
export async function startExecution(programName) {
  const response = await fetchAPI('/execution/start', {
    method: 'POST',
    body: JSON.stringify({ program: programName }),
  });
  if (!response.ok) {
    throw new Error('Failed to start execution');
  }
  return response.json();
}

export async function fetchExecutionState() {
  const response = await fetchAPI('/execution/state');
  if (!response.ok) {
    throw new Error('Failed to fetch execution state');
  }
  return response.json();
}

export async function stopExecution() {
  const response = await fetchAPI('/execution/stop', {
    method: 'POST',
  });
  return response;
}

// Cookie utilities
export function setUsernameCookie(username) {
  document.cookie = `username=${encodeURIComponent(username)}; path=/; max-age=86400`;
}

export function getUsernameCookie() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'username') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export function deleteUsernameCookie() {
  document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
