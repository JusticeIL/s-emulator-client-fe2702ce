# Java Client Example for S-Emulator API

This document provides a complete JavaFX client example showing how to interact with the S-Emulator REST API.

## Maven Dependencies

```xml
<dependencies>
    <!-- JavaFX -->
    <dependency>
        <groupId>org.openjfx</groupId>
        <artifactId>javafx-controls</artifactId>
        <version>17.0.2</version>
    </dependency>
    
    <!-- OkHttp for HTTP requests -->
    <dependency>
        <groupId>com.squareup.okhttp3</groupId>
        <artifactId>okhttp</artifactId>
        <version>4.10.0</version>
    </dependency>
    
    <!-- Gson for JSON -->
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.10</version>
    </dependency>
</dependencies>
```

## API Client Implementation

### ApiClient.java

```java
package com.semulator.client;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import okhttp3.*;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static final String BASE_URL = "http://localhost:8080/S-emulator/api";
    private final OkHttpClient client;
    private final Gson gson;
    private final CookieJar cookieJar;

    public ApiClient() {
        this.gson = new Gson();
        this.cookieJar = new JavaNetCookieJar(new java.net.CookieManager());
        
        this.client = new OkHttpClient.Builder()
                .cookieJar(cookieJar)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    // User Management
    public Response registerUser(String username) throws IOException {
        UserRequest userRequest = new UserRequest(username);
        String json = gson.toJson(userRequest);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/user")
                .post(body)
                .build();
        
        return client.newCall(request).execute();
    }

    public UserDTO getUser(String username) throws IOException {
        HttpUrl url = HttpUrl.parse(BASE_URL + "/user").newBuilder()
                .addQueryParameter("username", username)
                .build();
        
        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, UserDTO.class);
            }
            throw new IOException("Failed to fetch user: " + response.code());
        }
    }

    public List<UserDTO> getAllUsers() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/users")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, new TypeToken<List<UserDTO>>(){}.getType());
            }
            throw new IOException("Failed to fetch users");
        }
    }

    public UserDTO addCredits(int amount) throws IOException {
        CreditRequest creditRequest = new CreditRequest(amount);
        String json = gson.toJson(creditRequest);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/user/credit")
                .put(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String responseJson = response.body().string();
                return gson.fromJson(responseJson, UserDTO.class);
            }
            throw new IOException("Failed to add credits");
        }
    }

    // Programs
    public List<ProgramData> getSharedPrograms() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/shared/programs")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, new TypeToken<List<ProgramData>>(){}.getType());
            }
            throw new IOException("Failed to fetch programs");
        }
    }

    public Response setActiveProgram(String programName) throws IOException {
        ProgramNameRequest request = new ProgramNameRequest(programName);
        String json = gson.toJson(request);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request httpRequest = new Request.Builder()
                .url(BASE_URL + "/program/active")
                .put(body)
                .build();
        
        return client.newCall(httpRequest).execute();
    }

    public ProgramData getActiveProgram() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/program")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.code() == 204) {
                return null; // No active program
            }
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, ProgramData.class);
            }
            throw new IOException("Failed to fetch active program");
        }
    }

    public Response uploadProgram(File file) throws IOException {
        RequestBody fileBody = RequestBody.create(
            file,
            MediaType.parse("application/xml")
        );
        
        RequestBody body = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("program", file.getName(), fileBody)
                .build();
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/program")
                .post(body)
                .build();
        
        return client.newCall(request).execute();
    }

    public ProgramData expandProgram(int level) throws IOException {
        HttpUrl url = HttpUrl.parse(BASE_URL + "/program/expand").newBuilder()
                .addQueryParameter("level", String.valueOf(level))
                .build();
        
        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, ProgramData.class);
            }
            throw new IOException("Failed to expand program");
        }
    }

    // Execution
    public ProgramData executeProgram(ExecutionPayload payload) throws IOException {
        String json = gson.toJson(payload);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/execute")
                .post(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String responseJson = response.body().string();
                return gson.fromJson(responseJson, ProgramData.class);
            }
            throw new IOException("Failed to execute program: " + response.code());
        }
    }

    public CheckExecutionResponse checkExecution(String username) throws IOException {
        HttpUrl url = HttpUrl.parse(BASE_URL + "/program/checkExecution").newBuilder()
                .addQueryParameter("username", username)
                .build();
        
        Request request = new Request.Builder()
                .url(url)
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, CheckExecutionResponse.class);
            }
            throw new IOException("Failed to check execution");
        }
    }

    // Debug
    public ProgramData startDebug(DebugPayload payload) throws IOException {
        String json = gson.toJson(payload);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug")
                .post(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String responseJson = response.body().string();
                return gson.fromJson(responseJson, ProgramData.class);
            }
            throw new IOException("Failed to start debug");
        }
    }

    public ProgramData resumeDebug() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug/resume")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, ProgramData.class);
            }
            throw new IOException("Failed to resume debug");
        }
    }

    public ProgramData stepOver() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug/stepover")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, ProgramData.class);
            }
            throw new IOException("Failed to step over");
        }
    }

    public ProgramData stopDebug() throws IOException {
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug/stop")
                .get()
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            if (response.isSuccessful()) {
                String json = response.body().string();
                return gson.fromJson(json, ProgramData.class);
            }
            throw new IOException("Failed to stop debug");
        }
    }

    public Response addBreakpoint(int lineNumber) throws IOException {
        BreakpointPayload payload = new BreakpointPayload(lineNumber);
        String json = gson.toJson(payload);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug/breakpoint")
                .post(body)
                .build();
        
        return client.newCall(request).execute();
    }

    public Response deleteBreakpoint(Object lineNumber) throws IOException {
        BreakpointPayload payload = new BreakpointPayload(lineNumber);
        String json = gson.toJson(payload);
        
        RequestBody body = RequestBody.create(
            json,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(BASE_URL + "/program/debug/breakpoint")
                .delete(body)
                .build();
        
        return client.newCall(request).execute();
    }

    // DTOs
    public static class UserRequest {
        private String username;
        
        public UserRequest(String username) {
            this.username = username;
        }
    }

    public static class UserDTO {
        private String username;
        private int programsLoaded;
        private int functionsLoaded;
        private int credits;
        private int creditsUsed;
        private int programExecutionsCounter;
        
        // Getters and setters...
    }

    public static class ProgramData {
        private String programName;
        private String status;
        private int currentLine;
        private int currentCycles;
        private int maxProgramLevel;
        private java.util.Map<String, Integer> variables;
        private String minimalArchitectureNeededForRun;
        
        // Getters and setters...
    }

    public static class ExecutionPayload {
        private java.util.Map<String, Integer> arguments;
        private String architectureGeneration;
        
        public ExecutionPayload(java.util.Map<String, Integer> arguments, String architectureGeneration) {
            this.arguments = arguments;
            this.architectureGeneration = architectureGeneration;
        }
    }

    public static class DebugPayload {
        private java.util.Map<String, Integer> arguments;
        private List<Integer> breakpoints;
        private String architectureGeneration;
        
        public DebugPayload(java.util.Map<String, Integer> arguments, 
                          List<Integer> breakpoints, 
                          String architectureGeneration) {
            this.arguments = arguments;
            this.breakpoints = breakpoints;
            this.architectureGeneration = architectureGeneration;
        }
    }

    public static class CreditRequest {
        private int addCredits;
        
        public CreditRequest(int addCredits) {
            this.addCredits = addCredits;
        }
    }

    public static class BreakpointPayload {
        private Object lineNumber;
        
        public BreakpointPayload(Object lineNumber) {
            this.lineNumber = lineNumber;
        }
    }

    public static class ProgramNameRequest {
        private String programName;
        
        public ProgramNameRequest(String programName) {
            this.programName = programName;
        }
    }

    public static class CheckExecutionResponse {
        private boolean status;
        
        public boolean isStatus() {
            return status;
        }
    }
}
```

## JavaFX Login Example

### LoginController.java

```java
package com.semulator.client.ui;

import com.semulator.client.ApiClient;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.TextField;
import okhttp3.Response;

public class LoginController {
    @FXML private TextField usernameField;
    @FXML private Button loginButton;
    
    private ApiClient apiClient;
    
    public void initialize() {
        this.apiClient = new ApiClient();
    }
    
    @FXML
    private void handleLogin() {
        String username = usernameField.getText().trim();
        
        if (username.isEmpty()) {
            showError("Please enter a username");
            return;
        }
        
        // Validate username format
        if (!username.matches("[A-Za-z0-9_.-]+")) {
            showError("Username can only contain letters, numbers, dots, hyphens, and underscores");
            return;
        }
        
        loginButton.setDisable(true);
        
        new Thread(() -> {
            try {
                Response response = apiClient.registerUser(username);
                int statusCode = response.code();
                
                Platform.runLater(() -> {
                    if (statusCode == 201) {
                        showSuccess("Login successful!");
                        // Navigate to dashboard
                        navigateToDashboard();
                    } else if (statusCode == 409) {
                        showError("Username already taken");
                    } else if (statusCode == 400) {
                        showError("Invalid username");
                    } else if (statusCode == 403) {
                        showError("Already logged in");
                    } else {
                        showError("Login failed. Please try again.");
                    }
                    loginButton.setDisable(false);
                });
                
                response.close();
            } catch (Exception e) {
                Platform.runLater(() -> {
                    showError("Failed to connect to server: " + e.getMessage());
                    loginButton.setDisable(false);
                });
            }
        }).start();
    }
    
    private void showError(String message) {
        Alert alert = new Alert(Alert.AlertType.ERROR);
        alert.setTitle("Error");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
    
    private void showSuccess(String message) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("Success");
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
    
    private void navigateToDashboard() {
        // Implement navigation logic
        System.out.println("Navigating to dashboard...");
    }
}
```

## Usage Examples

### Execute a Program

```java
ApiClient client = new ApiClient();

// Register user
Response registerResponse = client.registerUser("john_doe");
if (registerResponse.code() == 201) {
    System.out.println("User registered successfully");
}

// Get programs
List<ApiClient.ProgramData> programs = client.getSharedPrograms();
if (!programs.isEmpty()) {
    // Set first program as active
    String programName = programs.get(0).getProgramName();
    client.setActiveProgram(programName);
    
    // Execute with arguments
    Map<String, Integer> args = new HashMap<>();
    args.put("x", 5);
    args.put("y", 10);
    
    ApiClient.ExecutionPayload payload = new ApiClient.ExecutionPayload(args, "GEN_A");
    ApiClient.ProgramData result = client.executeProgram(payload);
    
    System.out.println("Execution completed. Cycles: " + result.getCurrentCycles());
}
```

### Debug with Breakpoints

```java
ApiClient client = new ApiClient();

// Set active program
client.setActiveProgram("myProgram");

// Start debug with breakpoints
Map<String, Integer> args = new HashMap<>();
args.put("x", 1);

List<Integer> breakpoints = Arrays.asList(10, 20);

ApiClient.DebugPayload payload = new ApiClient.DebugPayload(args, breakpoints, "GEN_A");
ApiClient.ProgramData debugState = client.startDebug(payload);

// Step through
ApiClient.ProgramData nextState = client.stepOver();

// Resume
ApiClient.ProgramData resumed = client.resumeDebug();

// Stop
client.stopDebug();
```

## Notes

- Always use `credentials: 'include'` in fetch or configure OkHttp with a CookieJar
- Username validation: only `[A-Za-z0-9_.-]` characters allowed
- Multipart uploads require part name to be exactly `"program"`
- Handle HTTP 204 (No Content) when no active program is set
- Use `"all"` string to delete all breakpoints
