# Deployment Guide

This guide explains how to configure the S-Emulator Web Client for both local development and production deployment.

## Configuration Overview

The web client can connect to your Java backend in two ways:
- **Local Development**: Uses Vite proxy to forward requests to `localhost:8080`
- **Production**: Connects directly to your deployed Java backend URL

## Local Development Setup

**Important:** Both Vite and Tomcat want port 8080. You must run Tomcat on port 8081 for local development.

1. **Configure Tomcat to run on port 8081**:
   - Edit your Tomcat's `server.xml`
   - Change the Connector port from 8080 to 8081
   - Restart Tomcat

2. **Start your Tomcat/Java backend** on port 8081:
   ```bash
   # Make sure your S-emulator is running on localhost:8081/S-emulator
   # Example: Start Tomcat with deployed S-emulator.war
   ```

3. **Install dependencies and start the web client**:
   ```bash
   npm install
   npm run dev
   ```

4. The web client will run on `http://localhost:8080` with Vite's proxy automatically forwarding API requests to Tomcat on port 8081.
   - No CORS issues!
   - Browser sees everything from localhost:8080

## Production Deployment

### Step 1: Deploy Your Java Backend

Deploy your S-Emulator Java server to a hosting service. Make sure it's accessible via HTTPS.

Example deployment options:
- AWS EC2
- Google Cloud Compute Engine
- DigitalOcean Droplet
- Heroku
- Your own VPS

### Step 2: Configure CORS on Java Backend

Your Java backend must allow requests from your Lovable domain. Add these CORS headers to your Java server:

```java
response.setHeader("Access-Control-Allow-Origin", "https://your-app.lovableproject.com");
response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
response.setHeader("Access-Control-Allow-Credentials", "true");
```

**Important**: Replace `your-app.lovableproject.com` with your actual Lovable domain.

### Step 3: Configure Web Client

In Lovable, go to **Project Settings → Environment Variables** and add:

```
VITE_API_URL=https://your-backend-server.com/S-emulator/api
```

Replace `https://your-backend-server.com/S-emulator/api` with your deployed Java backend URL.

### Step 4: Deploy

Push your changes to Lovable. The app will automatically use your environment variable for API requests.

## Troubleshooting

### "Failed to connect to server" Error

**Cause**: The frontend cannot reach the backend.

**Solutions**:
1. Verify your Java backend is running and accessible
2. Check that CORS headers are properly configured
3. Ensure `VITE_API_URL` is set correctly in production
4. Test the backend URL directly in your browser

### CORS Errors

**Cause**: Your Java backend is blocking requests from the frontend domain.

**Solution**: Update your Java server's CORS configuration to allow requests from your Lovable domain.

### Local Development Not Working

**Cause**: Java backend not running on port 8080, or port conflict.

**Solution**:
1. Make sure Java backend is running: `http://localhost:8080/S-emulator/api/users`
2. Check no other app is using port 5173
3. Restart both servers

## Testing Your Deployment

After deployment, test these endpoints:

1. **Health check**: Visit `https://your-backend-server.com/S-emulator/api/users`
2. **Login**: Try logging in through your web app
3. **Program execution**: Load and run a program

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Production only | Full URL to your Java backend API | `https://api.example.com/S-emulator/api` |

## Support

For additional help:
- Check the main README.md
- Review API_DOCUMENTATION.md
- See QUICK_START.md for basic setup
