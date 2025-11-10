import { ADKConfig } from "../api/types";

/**
 * ADK Configuration
 *
 * Update these values to match your ADK instance:
 * - baseUrl: The URL where your ADK agent is running
 * - appName: The app name registered in your ADK instance
 */
export const adkConfig: ADKConfig = {
  // For iPhone/Android testing, use your Mac's IP address (not 127.0.0.1)
  // Find it by running: ipconfig getifaddr en0
  // Example: "http://192.168.1.100:8000"
  baseUrl: "http://192.168.1.153:8000", // Replace XXX with your Mac's IP
  appName: "app",
};

/**
 * User ID - can be a dummy value for now
 * In production, this should come from your auth system
 */
export const DEFAULT_USER_ID = "u_123";
