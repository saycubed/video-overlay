# Firebase Authentication Setup Guide

## What's Been Done

✓ Installed Firebase SDK
✓ Created Firebase configuration file (src/firebase.js)
✓ Created Auth component with Google sign-in
✓ Integrated authentication into your app header
✓ Added user state management

## Next Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "video-overlay" or "OverlayTV")
4. Follow the prompts to create your project

### 2. Enable Google Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Click on the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle the **Enable** switch
6. Enter a project support email
7. Click **Save**

### 3. Register Your Web App

1. In Firebase Console, click the **gear icon** (Settings) next to "Project Overview"
2. Click **Project settings**
3. Scroll down to "Your apps" section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter app nickname (e.g., "OverlayTV Web")
6. Click **Register app**

### 4. Get Your Firebase Config

You'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 5. Update Your Configuration

1. Open `src/firebase.js`
2. Replace the placeholder values (lines 8-14) with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

### 6. Add Authorized Domain (Important!)

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your development domain:
   - For local development: `localhost` (should already be there)
   - For production: Your actual domain (e.g., `your-app.com`)

### 7. Test Your Integration

1. Start your development server:
   ```bash
   npm start
   ```

2. Open your app in the browser
3. You should see a "Sign in with Google" button in the header
4. Click it to test the sign-in flow
5. After signing in, you should see your profile picture and name in the header

## Features Included

- Google sign-in with popup
- YouTube API scope (for potential YouTube integration)
- User profile display (avatar + name)
- Sign out functionality
- Persistent auth state across page reloads

## Security Note

Never commit your Firebase config with real credentials to a public repository. Consider using environment variables for production deployments.

## Need Help?

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Google Sign-In Guide](https://firebase.google.com/docs/auth/web/google-signin)
