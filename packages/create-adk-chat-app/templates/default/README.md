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

## Customizing Your Chat Theme

Edit `theme.ts` to customize the colors and appearance of your chat interface. All theme fields are optional - uncomment and modify only the colors you want to change:

```typescript
export const theme: ChatTheme = {
  primaryColor: '#10B981',
  userMessageBackground: '#F3F4F6',
  // ... see theme.ts for all available options
};
```

Changes to your theme will automatically hot-reload during development!

## Web Development & CORS

If you are developing on the **Web** (`npm run web` or `w` in Expo), you may encounter CORS errors when connecting directly to Cloud Run / Agent Engine.

This happens because browsers block requests to domains that don't explicitly allow your `localhost` origin.

### Solutions:

1.  **Use a Local Proxy (Recommended for Web Dev)**:
    - This app includes a bundled proxy server in the `server/` directory.
    - Start it with:
      ```bash
      # Configure with your remote Cloud Run URL
      CLOUD_RUN_URL=https://your-app.run.app DEFAULT_APP_NAME=MBS npm run proxy
      ```
    - Update your app to point to `http://localhost:3000`:
      ```bash
      npx create-adk-chat-app --update
      ```
      (Select "Local Proxy")

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
