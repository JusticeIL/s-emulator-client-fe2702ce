# S-Emulator Client - Quick Start Guide

Get up and running with the S-Emulator web and Java clients in minutes!

## 🚀 Web Client Setup (5 minutes)

### Step 1: Start the Server
Ensure your S-Emulator server is running:
```bash
# Deploy S-emulator.war on Tomcat
# Server should be accessible at http://localhost:8080/S-emulator
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Open Browser
Navigate to `http://localhost:5173` (or the URL shown in terminal)

### Step 5: Login & Test
1. Enter a username (letters, numbers, dots, hyphens, underscores only)
2. Click "Login"
3. Browse available programs
4. Click "Run" to execute a program

**That's it!** You're ready to use the web client. 🎉

---

## ☕ Java Client Setup

### Build Your Own Client

See **[JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md)** for complete source code including:

1. **ApiClient.java** - Full REST API client implementation
2. **LoginController.java** - JavaFX UI controller example  
3. **Maven dependencies** - All required libraries
4. **Usage examples** - Code samples for every endpoint

**Requirements:**
- Java 8 or higher
- Maven or Gradle for building
- JavaFX libraries (included in Java 8, separate download for Java 11+)
- S-Emulator server running at `http://localhost:8080/S-emulator`

**That's it!** Follow the examples to build your JavaFX client. 🎉

---

## 📖 Documentation Index

### For Web Developers
- **[README.md](./README.md)** - Complete web client documentation
  - Features overview
  - Installation & setup
  - Project structure
  - Configuration options
  - Troubleshooting

### For Java Developers
- **[JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md)** - Complete Java implementation
  - Full ApiClient.java source code
  - LoginController.java example
  - Usage examples for all endpoints
  - Maven dependencies
  - Cookie management

### For API Integration
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete REST API reference
  - All endpoints with examples
  - Request/response formats
  - Authentication details
  - Error handling
  - Testing with cURL/Postman

### Code Examples
- **Complete Java client source code** - See JAVA_CLIENT_EXAMPLE.md
- **All API endpoints documented** - See API_DOCUMENTATION.md

---

## 🎯 Common Tasks

### Run a Program
1. Login to web client
2. Go to Dashboard
3. Click "Run" on any program
4. View execution results

### Build a Java Client
1. See JAVA_CLIENT_EXAMPLE.md for complete code
2. Copy ApiClient.java to your project
3. Add Maven dependencies
4. Implement UI with JavaFX
5. Use debug mode with breakpoints

### Add New Program to Server
1. Prepare program XML file
2. Use multipart upload endpoint:
```javascript
const formData = new FormData();
formData.append('program', file);
fetch('/api/program', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

### Check User Execution Status
```bash
curl http://localhost:8080/S-emulator/api/program/checkExecution?username=john
```

---

## 🔧 Configuration

### Web Client API URL
Edit `src/lib/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/S-emulator/api';
```

### Java Client API URL
Edit `ApiClient.java`:
```java
private static final String BASE_URL = "http://localhost:8080/S-emulator/api";
```

---

## 🐛 Quick Troubleshooting

### Web Client Won't Connect
1. Check server is running: `curl http://localhost:8080/S-emulator/api/shared/programs`
2. Check browser console for CORS errors
3. Verify API_BASE_URL in `src/lib/api.js`

### Building Java Client
1. Check Java version: `java -version` (need 8+)
2. Add JavaFX dependencies to Maven/Gradle
3. See JAVA_CLIENT_EXAMPLE.md for complete setup
4. Check server is accessible

### Login Fails
1. Username must match pattern: `[A-Za-z0-9_.-]`
2. Check server logs for cookie errors
3. Clear browser cookies and try again

### Programs Don't Load
1. Verify programs exist on server
2. Check GET `/api/shared/programs` endpoint
3. Look for 404 or 500 errors in browser console

---

## 📞 Need Help?

### Check These First:
1. **Server Running?** Test with: `curl http://localhost:8080/S-emulator/api/shared/programs`
2. **Browser Console:** Look for red errors (F12 → Console tab)
3. **Network Tab:** Check API requests/responses (F12 → Network tab)
4. **Server Logs:** Check Tomcat logs for backend errors

### Documentation:
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference
- [README.md](./README.md) - Web client details
- [JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md) - Java client code

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] S-Emulator server is running on port 8080
- [ ] Web client is accessible (http://localhost:5173)
- [ ] Can access server API: `curl http://localhost:8080/S-emulator/api/shared/programs`
- [ ] Browser allows cookies (not in incognito/private mode)
- [ ] Java client has correct Java version (8+)
- [ ] Username follows format: `[A-Za-z0-9_.-]`

---

## 🎓 Learning Path

### Beginners
1. Read [README.md](./README.md) - Get overview
2. Follow "Web Client Setup" above
3. Login and run a program
4. Explore the Dashboard

### Intermediate
1. Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Test endpoints with cURL
3. Modify `src/lib/api.js` for new features
4. Explore debug mode in Java client

### Advanced
1. Study [JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md)
2. Build custom client using the API
3. Implement new features (file upload, debug mode)
4. Contribute to the project

---

## 🌟 Quick Examples

### JavaScript - Login & Execute
```javascript
// Register user
const response = await fetch('http://localhost:8080/S-emulator/api/user', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'john' })
});

// Set active program
await fetch('http://localhost:8080/S-emulator/api/program/active', {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ programName: 'fibonacci' })
});

// Execute
const result = await fetch('http://localhost:8080/S-emulator/api/program/execute', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    arguments: { n: 5 },
    architectureGeneration: 'GEN_A'
  })
});

const data = await result.json();
console.log('Cycles:', data.currentCycles);
```

### Java - Login & Execute
```java
ApiClient client = new ApiClient();

// Register
Response response = client.registerUser("john");

// Set active program
client.setActiveProgram("fibonacci");

// Execute
Map<String, Integer> args = new HashMap<>();
args.put("n", 5);
ExecutionPayload payload = new ExecutionPayload(args, "GEN_A");
ProgramData result = client.executeProgram(payload);

System.out.println("Cycles: " + result.getCurrentCycles());
```

### cURL - Quick Test
```bash
# Register
curl -X POST http://localhost:8080/S-emulator/api/user \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}' \
  -c cookies.txt

# Get programs
curl http://localhost:8080/S-emulator/api/shared/programs -b cookies.txt

# Set active
curl -X PUT http://localhost:8080/S-emulator/api/program/active \
  -H "Content-Type: application/json" \
  -d '{"programName":"fibonacci"}' \
  -b cookies.txt

# Execute
curl -X POST http://localhost:8080/S-emulator/api/program/execute \
  -H "Content-Type: application/json" \
  -d '{"arguments":{"n":5},"architectureGeneration":"GEN_A"}' \
  -b cookies.txt
```

---

**Ready to build something amazing? Let's go! 🚀**
