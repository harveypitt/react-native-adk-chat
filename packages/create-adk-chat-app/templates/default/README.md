# ADK Chat App

This app was created with `create-adk-chat-app`.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the app:
    ```bash
    npm start
    ```

## Web Development & CORS

If you are developing on the **Web** (`npm run web` or `w` in Expo), you may encounter CORS errors when connecting directly to Cloud Run / Agent Engine.

This happens because browsers block requests to domains that don't explicitly allow your `localhost` origin.

### Solutions:

1.  **Use a Local Proxy (Recommended for Web Dev)**:
    - Run the provided local proxy server (if available) or `server-cloudrun` from the ADK repository.
    - Update your app to point to `http://localhost:3000` instead of the remote URL.
    - Run `npx create-adk-chat-app --update` to switch to "Local Proxy" mode.

2.  **Use a CORS Extension**:
    - For development only, you can use a browser extension that disables CORS restrictions (e.g., "Allow CORS: Access-Control-Allow-Origin").
    - **Note**: Turn this off when browsing normal sites for security.

3.  **Use Native Simulators**:
    - Run on iOS (`i`) or Android (`a`) simulators instead. Native apps do not enforce CORS restrictions like browsers do.

## Configuration

You can update your connection settings at any time:

```bash
npx create-adk-chat-app --update
```
