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
  // Validate username - disallow spaces and special characters
  if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
    throw new Error('Username can only contain letters, numbers, dots, hyphens, and underscores');
  }
  
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

export async function fetchAllUsers() {
  const response = await fetchAPI('/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function addCredits(amount) {
  const response = await fetchAPI('/user/credit', {
    method: 'PUT',
    body: JSON.stringify({ addCredits: amount }),
  });
  if (!response.ok) {
    throw new Error('Failed to add credits');
  }
  return response.json();
}

// Programs
export async function fetchSharedPrograms() {
  const response = await fetchAPI('/shared/programs');
  if (!response.ok) {
    throw new Error('Failed to fetch programs');
  }
  return response.json();
}

export async function fetchSharedFunctions() {
  const response = await fetchAPI('/shared/functions');
  if (!response.ok) {
    throw new Error('Failed to fetch functions');
  }
  return response.json();
}

export async function setActiveProgram(programName) {
  const response = await fetchAPI('/program/active', {
    method: 'PUT',
    body: JSON.stringify({ programName }),
  });
  return response;
}

export async function fetchActiveProgram() {
  const response = await fetchAPI('/program');
  if (response.status === 204) {
    return null; // No active program
  }
  if (!response.ok) {
    throw new Error('Failed to fetch active program');
  }
  return response.json();
}

export async function uploadProgram(file) {
  const formData = new FormData();
  formData.append('program', file); // Part name MUST be "program"
  
  const response = await fetchAPI('/program', {
    method: 'POST',
    headers: {}, // Remove Content-Type, let browser set it for multipart
    body: formData,
  });
  return response;
}

export async function expandProgram(level) {
  const response = await fetchAPI(`/program/expand?level=${level}`);
  if (!response.ok) {
    throw new Error('Failed to expand program');
  }
  return response.json();
}

export async function checkExecution(username) {
  const response = await fetchAPI(`/program/checkExecution?username=${encodeURIComponent(username)}`);
  if (!response.ok) {
    throw new Error('Failed to check execution');
  }
  return response.json();
}

// Execution
export async function executeProgram(args = {}, architectureGeneration = 'GEN_A') {
  const response = await fetchAPI('/program/execute', {
    method: 'POST',
    body: JSON.stringify({
      arguments: args,
      architectureGeneration,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to execute program');
  }
  return response.json();
}

// Debug
export async function startDebug(args = {}, breakpoints = [], architectureGeneration = 'GEN_A') {
  const response = await fetchAPI('/program/debug', {
    method: 'POST',
    body: JSON.stringify({
      arguments: args,
      breakpoints,
      architectureGeneration,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to start debug');
  }
  return response.json();
}

export async function resumeDebug() {
  const response = await fetchAPI('/program/debug/resume');
  if (!response.ok) {
    throw new Error('Failed to resume debug');
  }
  return response.json();
}

export async function stepOver() {
  const response = await fetchAPI('/program/debug/stepover');
  if (!response.ok) {
    throw new Error('Failed to step over');
  }
  return response.json();
}

export async function stopDebug() {
  const response = await fetchAPI('/program/debug/stop');
  if (!response.ok) {
    throw new Error('Failed to stop debug');
  }
  return response.json();
}

export async function addBreakpoint(lineNumber) {
  const response = await fetchAPI('/program/debug/breakpoint', {
    method: 'POST',
    body: JSON.stringify({ lineNumber }),
  });
  return response;
}

export async function deleteBreakpoint(lineNumber) {
  const response = await fetchAPI('/program/debug/breakpoint', {
    method: 'DELETE',
    body: JSON.stringify({ lineNumber }), // Can be integer or "all"
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
