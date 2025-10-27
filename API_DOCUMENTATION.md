# S-Emulator REST API Documentation

Complete API reference for the S-Emulator backend server.

## Base URL

```
Development: http://localhost:8080/S-emulator
API Base Path: /api
```

## Authentication

The server uses cookie-based authentication with a cookie named `username`.

### Cookie Setup
- **Name**: `username`
- **Value**: URL-encoded username string
- **Path**: `/`
- **Max-Age**: Server-defined (typically session-based)

### Important Notes
- Registration (`POST /api/user`) must be called when there is no `username` cookie present
- All authenticated endpoints require the `username` cookie to be present
- Avoid raw spaces or illegal characters in username - use only `[A-Za-z0-9_.-]`
- Always include `credentials: 'include'` in fetch requests or configure OkHttp with CookieJar

## Data Transfer Objects (DTOs)

### UserDTO

```json
{
  "username": "string",
  "programsLoaded": 0,
  "functionsLoaded": 0,
  "credits": 0,
  "creditsUsed": 0,
  "programExecutionsCounter": 0
}
```

### ProgramData

```json
{
  "programName": "string",
  "status": "loaded|running|debug",
  "currentLine": 42,
  "currentCycles": 1000,
  "maxProgramLevel": 3,
  "variables": {
    "x": 1,
    "y": 2
  },
  "functions": [],
  "minimalArchitectureNeededForRun": "GEN_A"
}
```

### VariableDTO

```json
{
  "name": "x",
  "value": 123
}
```

### ExecutionPayload

```json
{
  "arguments": {
    "x": 1,
    "y": 2
  },
  "architectureGeneration": "GEN_A"
}
```

### DebugPayload

```json
{
  "arguments": {
    "x": 1
  },
  "breakpoints": [10, 20],
  "architectureGeneration": "GEN_A"
}
```

### CreditRequest

```json
{
  "addCredits": 50
}
```

### BreakpointPayload

```json
{
  "lineNumber": 10
}
```
or
```json
{
  "lineNumber": "all"
}
```

### CheckExecutionResponse

```json
{
  "status": true
}
```

## Endpoints

### User Management

#### Register User
```http
POST /api/user
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "moshe"
}
```

**Responses:**
- `201 Created` - User registered successfully, cookie set
- `409 Conflict` - Username already taken
- `400 Bad Request` - Invalid username format
- `403 Forbidden` - Already logged in

**Important:** Server sets `username` cookie on success. Tomcat rejects cookies with spaces, so validate username format client-side: `[A-Za-z0-9_.-]`

---

#### Get User Information
```http
GET /api/user?username=moshe
```

**Auth:** No cookie required (read-only)

**Response:** `200 OK + UserDTO`
```json
{
  "username": "moshe",
  "programsLoaded": 5,
  "functionsLoaded": 2,
  "credits": 100,
  "creditsUsed": 20,
  "programExecutionsCounter": 15
}
```

**Errors:**
- `400 Bad Request` - Missing username parameter

---

#### Get All Users
```http
GET /api/users
Cookie: username=moshe
```

**Auth:** Requires `username` cookie

**Response:** `200 OK + UserDTO[]`
```json
[
  {
    "username": "moshe",
    "programsLoaded": 5,
    ...
  },
  {
    "username": "john",
    "programsLoaded": 3,
    ...
  }
]
```

---

#### Add Credits
```http
PUT /api/user/credit
Cookie: username=moshe
Content-Type: application/json
```

**Request Body:**
```json
{
  "addCredits": 50
}
```

**Response:** `200 OK + Updated UserDTO`
```json
{
  "username": "moshe",
  "credits": 150,
  ...
}
```

**Errors:**
- `400 Bad Request` - Invalid credit amount

---

### Program Management

#### Get Shared Programs
```http
GET /api/shared/programs
```

**Auth:** Public endpoint

**Response:** `200 OK + ProgramData[]`
```json
[
  {
    "programName": "fibonacci",
    "status": "loaded",
    "currentLine": 0,
    "currentCycles": 0,
    "maxProgramLevel": 2,
    "variables": {},
    "minimalArchitectureNeededForRun": "GEN_A"
  }
]
```

---

#### Get Shared Functions
```http
GET /api/shared/functions
```

**Auth:** Public endpoint

**Response:** `200 OK + ProgramData[]`

Returns list of all functions (each represented as ProgramData)

---

#### Set Active Program
```http
PUT /api/program/active
Cookie: username=moshe
Content-Type: application/json
```

**Request Body:**
```json
{
  "programName": "fibonacci"
}
```

**Response:** 
- `200 OK` - Program set as active
- `400 Bad Request` - Program not found

**Note:** Sets the active program for the current user. Subsequent operations (execute, debug) will use this program.

---

#### Get Active Program
```http
GET /api/program
Cookie: username=moshe
```

**Auth:** Requires `username` cookie

**Response:** 
- `200 OK + ProgramData` - Active program details
- `204 No Content` - No active program set

```json
{
  "programName": "fibonacci",
  "status": "loaded",
  "currentLine": 0,
  "currentCycles": 0,
  "maxProgramLevel": 2,
  "variables": {
    "n": 0,
    "result": 0
  },
  "minimalArchitectureNeededForRun": "GEN_A"
}
```

---

#### Upload Program
```http
POST /api/program
Cookie: username=moshe
Content-Type: multipart/form-data
```

**Form Data:**
- **Part Name:** `program` (must be exactly "program")
- **Content:** XML file bytes

**Responses:**
- `200 OK` - Program uploaded and parsed successfully
- `406 Not Acceptable` - JAXB parse error (invalid XML format)
- `400 Bad Request` - Missing file part

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('program', fileInput.files[0]); // name MUST be "program"

fetch('/api/program', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

---

#### Expand Program
```http
GET /api/program/expand?level=2
Cookie: username=moshe
```

**Auth:** Requires `username` cookie

**Query Parameters:**
- `level` (integer) - Expansion level

**Response:** `200 OK + Updated ProgramData`

Expands the active program to the specified level (server-side expansion).

---

#### Check User Execution Status
```http
GET /api/program/checkExecution?username=moshe
```

**Auth:** None (query-based)

**Response:** `200 OK + CheckExecutionResponse`
```json
{
  "status": true
}
```

Returns whether the specified user is currently running a program.

---

### Execution

#### Execute Program
```http
POST /api/program/execute
Cookie: username=moshe
Content-Type: application/json
```

**Request Body:**
```json
{
  "arguments": {
    "x": 5,
    "y": 10
  },
  "architectureGeneration": "GEN_A"
}
```

**Response:** `200 OK + ProgramData` (execution result)
```json
{
  "programName": "add",
  "status": "loaded",
  "currentLine": 5,
  "currentCycles": 42,
  "variables": {
    "x": 5,
    "y": 10,
    "result": 15
  },
  "minimalArchitectureNeededForRun": "GEN_A"
}
```

Executes the active program with provided arguments and architecture.

---

### Debug Operations

#### Start Debug Mode
```http
POST /api/program/debug
Cookie: username=moshe
Content-Type: application/json
```

**Request Body:**
```json
{
  "arguments": {
    "x": 1,
    "y": 2
  },
  "breakpoints": [10, 22],
  "architectureGeneration": "GEN_A"
}
```

**Response:** `200 OK + ProgramData` (debug state)

Sets active program to debug mode with specified arguments and breakpoints.

---

#### Resume Debug
```http
GET /api/program/debug/resume
Cookie: username=moshe
```

**Response:** `200 OK + Updated ProgramData`

Resumes debug execution until next breakpoint or completion.

---

#### Step Over (Single Step)
```http
GET /api/program/debug/stepover
Cookie: username=moshe
```

**Response:** `200 OK + Updated ProgramData`

Executes a single instruction and returns updated state.

---

#### Stop Debug
```http
GET /api/program/debug/stop
Cookie: username=moshe
```

**Response:** `200 OK + Updated ProgramData`

Stops debug mode and returns final state.

---

#### Add Breakpoint
```http
POST /api/program/debug/breakpoint
Cookie: username=moshe
Content-Type: application/json
```

**Request Body:**
```json
{
  "lineNumber": 10
}
```

**Response:** `200 OK`
**Errors:** `400 Bad Request` - Invalid line number

---

#### Delete Breakpoint
```http
DELETE /api/program/debug/breakpoint
Cookie: username=moshe
Content-Type: application/json
```

**Request Body (single breakpoint):**
```json
{
  "lineNumber": 10
}
```

**Request Body (all breakpoints):**
```json
{
  "lineNumber": "all"
}
```

**Response:** `200 OK`

**Special Behavior:** Use string `"all"` to clear all breakpoints.

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response data |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success but no data to return |
| 400 | Bad Request | Invalid input, check request format |
| 403 | Forbidden | Authentication required or already logged in |
| 406 | Not Acceptable | Invalid file format (upload) |
| 409 | Conflict | Resource already exists (username taken) |
| 500 | Internal Server Error | Server-side error, contact admin |

### Client-Side Error Handling

```javascript
try {
  const response = await fetch(url, options);
  
  if (response.status === 204) {
    // No content - handle accordingly
    return null;
  }
  
  if (!response.ok) {
    // Handle HTTP errors
    switch (response.status) {
      case 400:
        throw new Error('Invalid request');
      case 403:
        throw new Error('Authentication required');
      case 409:
        throw new Error('Resource conflict');
      default:
        throw new Error(`Server error: ${response.status}`);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
}
```

## Best Practices

### 1. Username Validation
```javascript
// Client-side validation before registration
const isValidUsername = (username) => {
  return /^[A-Za-z0-9_.-]+$/.test(username);
};
```

### 2. Cookie Management
```javascript
// Always include credentials
fetch(url, {
  method: 'POST',
  credentials: 'include',  // CRITICAL
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### 3. Multipart Upload
```javascript
// Correct part name is essential
const formData = new FormData();
formData.append('program', file);  // Must be "program"

fetch('/api/program', {
  method: 'POST',
  credentials: 'include',
  body: formData  // Don't set Content-Type, browser sets it
});
```

### 4. Handle 204 No Content
```javascript
const program = await fetchActiveProgram();
if (!program) {
  // Handle no active program case
  console.log('No program selected');
}
```

### 5. URL Encoding
```javascript
// Always encode query parameters
const username = encodeURIComponent(userInput);
fetch(`/api/user?username=${username}`);
```

## Rate Limiting & Performance

- No explicit rate limiting documented
- Recommended: Implement client-side debouncing for rapid requests
- Polling: Use reasonable intervals (2-5 seconds) for execution state
- Batch operations when possible

## Security Considerations

1. **Username Validation**: Only allow `[A-Za-z0-9_.-]` to prevent cookie injection
2. **Cookie Security**: Cookies are HttpOnly (set by server)
3. **CORS**: Ensure server allows your origin
4. **Input Sanitization**: Validate all user input before sending to API
5. **File Upload**: Only accept valid program XML files

## Testing Endpoints

### Using cURL

```bash
# Register user
curl -X POST http://localhost:8080/S-emulator/api/user \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}' \
  -c cookies.txt

# Get programs (with cookie)
curl -X GET http://localhost:8080/S-emulator/api/shared/programs \
  -b cookies.txt

# Set active program
curl -X PUT http://localhost:8080/S-emulator/api/program/active \
  -H "Content-Type: application/json" \
  -d '{"programName":"fibonacci"}' \
  -b cookies.txt

# Execute program
curl -X POST http://localhost:8080/S-emulator/api/program/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments":{"n":5},"architectureGeneration":"GEN_A"}' \
  -b cookies.txt
```

### Using Postman

1. Create new request
2. Set method and URL
3. Add `Content-Type: application/json` header
4. Enable "Send cookies" in settings
5. Add request body (if needed)
6. Send and verify response

---

## Version Information

- **Server**: S-Emulator WAR deployed on Tomcat
- **API Version**: 1.0 (implied)
- **Last Updated**: 2025-10-27

For implementation examples, see:
- **[JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md)** - Complete JavaFX client code
- **[Client.jar](./public/examples/Client.jar)** - Working JavaFX application
