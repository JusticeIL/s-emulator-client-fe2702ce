# S-Emulator Web Client

A modern web client for the S-Emulator Java server, built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **User Authentication**: Cookie-based login system
- **Program Management**: Browse and select programs from the server
- **Execution Interface**: Run programs and monitor execution state
- **Light/Dark Mode**: iPhone-style theme toggle with smooth animations
- **Responsive Design**: Works seamlessly on all screen sizes
- **Real-time Updates**: Live execution monitoring and variable tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- S-Emulator server running at `http://localhost:8080/S-emulator`
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 API Integration

The client connects to the S-Emulator REST API at:
```
http://localhost:8080/S-emulator/api
```

### Key Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user` | POST | Register new user |
| `/api/user` | GET | Get user information |
| `/api/shared/programs` | GET | List all available programs |
| `/api/program/active` | PUT | Set active program |
| `/api/program` | GET | Get active program details |
| `/api/program/execute` | POST | Execute the active program |
| `/api/program/debug/*` | GET/POST/DELETE | Debug operations |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 📱 Pages

### 1. Login (`/`)
- Simple username-based authentication
- Validates username format (letters, numbers, dots, hyphens, underscores only)
- Sets authentication cookie on successful registration
- Theme toggle available

### 2. Dashboard (`/dashboard`)
- Displays all available programs from the server
- Shows program name, expansion level, and cycle count
- "Run" button for each program
- Sets the selected program as active before navigation
- Logout functionality

### 3. Execution (`/execution`)
- Displays active program details
- Shows all instructions with color-coded compatibility
- Execute program with selected architecture
- Real-time execution status display
- Variable values monitoring
- Current line highlighting during execution

## 🎨 Design System

The application uses a comprehensive design system with:
- **Colors**: HSL-based semantic tokens for consistent theming
- **Typography**: Inter font family
- **Dark/Light Modes**: Automatic theme switching with localStorage persistence
- **Animations**: Smooth transitions and pulse effects for executing states
- **Components**: shadcn/ui component library with custom styling

### Theme Toggle
iPhone-style animated switch with:
- Smooth slider animation
- Sun/moon icons for visual clarity
- Border glow on hover
- Persistent theme preference

## 🔧 Configuration

### API Base URL
Located in `src/lib/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/S-emulator/api';
```

### Cookie Management
- Cookie name: `username`
- Max age: 24 hours (86400 seconds)
- Path: `/`
- Automatically included in all API requests via `credentials: 'include'`

## 🧪 Development

### Project Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ThemeToggle.jsx  # Theme switcher component
├── hooks/
│   ├── use-mobile.tsx   # Mobile detection hook
│   ├── use-toast.ts     # Toast notification hook
│   └── useTheme.js      # Theme management hook
├── lib/
│   ├── api.js           # API client functions
│   └── utils.ts         # Utility functions
├── pages/
│   ├── Login.jsx        # Login page
│   ├── Dashboard.jsx    # Programs list page
│   ├── Execution.jsx    # Program execution page
│   └── NotFound.jsx     # 404 page
├── App.jsx              # Main app component with routing
├── index.css            # Global styles and design tokens
└── main.jsx             # Application entry point
```

### Adding New Features

1. **New API Endpoint**: Add function to `src/lib/api.js`
2. **New Page**: Create component in `src/pages/` and add route in `src/App.jsx`
3. **New UI Component**: Use shadcn/ui or create in `src/components/`
4. **Styling**: Update design tokens in `src/index.css` or `tailwind.config.ts`

## 📚 Additional Resources

- **[JAVA_CLIENT_EXAMPLE.md](./JAVA_CLIENT_EXAMPLE.md)**: Complete JavaFX client implementation with working example
- **[Client.jar](./public/examples/Client.jar)**: Downloadable JavaFX client application (Java 8+ compatible)
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**: Full REST API specification with all endpoints and payloads

### Running the Java Client Example

```bash
# Download and run the JavaFX client
java -jar public/examples/Client.jar

# Or with JavaFX modules (Java 11+)
java --module-path /path/to/javafx-sdk/lib \
  --add-modules javafx.controls,javafx.fxml \
  -jar public/examples/Client.jar
```

The Java client demonstrates:
- Complete API integration with proper cookie handling
- User authentication and program management
- Debug mode with breakpoints
- Variable monitoring and execution control

## 🐛 Troubleshooting

### Server Connection Issues
```bash
# Verify server is running
curl http://localhost:8080/S-emulator/api/shared/programs

# Check CORS configuration on server
# Ensure server accepts requests from your client origin
```

### Cookie Not Being Set
- Ensure `credentials: 'include'` is set in all fetch requests
- Check browser console for cookie errors
- Verify server is setting cookies correctly (check HTTP response headers)

### Theme Not Persisting
- Check browser localStorage is enabled
- Open DevTools → Application → Local Storage
- Verify `theme` key is being saved

## 📄 Technologies Used

This project is built with:
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **React Router** - Client-side routing
- **Lucide React** - Icon library

## 🤝 Contributing

1. Ensure the S-Emulator server is running
2. Test all three pages (Login, Dashboard, Execution)
3. Verify theme switching works correctly
4. Test with different programs from the server
5. Check error handling for network failures

## 🎯 Future Enhancements

- [ ] Program upload functionality
- [ ] Debug mode with breakpoints
- [ ] Step-by-step execution
- [ ] Program expansion controls
- [ ] Credit management UI
- [ ] User profile page
- [ ] Execution history
- [ ] Multiple architecture selection
- [ ] Variable editing during debug
- [ ] Export execution results

## 📝 Project Info

**Lovable Project URL**: https://lovable.dev/projects/c12da224-e982-472e-bdc8-8110306b4b40

## 🚀 Deployment

Simply open [Lovable](https://lovable.dev/projects/c12da224-e982-472e-bdc8-8110306b4b40) and click on Share → Publish.

### Custom Domain

Yes, you can connect a custom domain! Navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

Built with ❤️ using React, Vite, and Tailwind CSS
