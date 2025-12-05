/**
 * ADK Proxy Client
 * Client for interacting with the ADK Agent Proxy Service
 * which handles OAuth authentication with Google Agent Engine
 */

export interface ProxyConfig {
  baseUrl: string; // e.g., "http://localhost:3000" or "https://your-proxy.vercel.app"
  defaultAppName?: string; // Optional default app name (for Cloud Run deployments)
}

export interface CreateSessionResponse {
  output: {
    id: string;
    userId: string;
    appName: string;
    lastUpdateTime: number;
    state: Record<string, any>;
    events: any[];
  };
}

export interface SessionData {
  id: string;
  userId: string;
  appName: string;
  lastUpdateTime: number;
  state: Record<string, any>;
  events: any[];
}

export interface ListSessionsResponse {
  output: {
    sessions: SessionData[];
  };
}

export interface ChatRequest {
  user_id: string;
  session_id?: string;
  message: string;
  app_name?: string; // Optional app name (for Cloud Run deployments)
  run_config?: Record<string, any>;
}

export class ProxyClient {
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = config;
  }

  /**
   * List available apps/agents (Cloud Run only)
   * @returns Promise<string[]> - Array of available app names
   */
  async listApps(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/apps`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to list apps: ${error.error || response.statusText}`
        );
      }

      const data = await response.json();
      return data.apps || [];
    } catch (error) {
      console.error("List Apps Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to list apps"
      );
    }
  }

  /**
   * Create a new session for a user
   * @param userId - The user ID
   * @param sessionId - Optional custom session ID (auto-generated if not provided)
   * @param appName - Optional app name (for Cloud Run deployments)
   * @returns Promise<CreateSessionResponse>
   */
  async createSession(
    userId: string,
    sessionId?: string,
    appName?: string
  ): Promise<CreateSessionResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          ...(sessionId && { session_id: sessionId }),
          ...(appName || this.config.defaultAppName) && { app_name: appName || this.config.defaultAppName },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to create session: ${error.error || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Create Session Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create session"
      );
    }
  }

  /**
   * Get an existing session
   * @param userId - The user ID
   * @param sessionId - The session ID
   * @param appName - Optional app name (for Cloud Run deployments)
   * @returns Promise<SessionData>
   */
  async getSession(userId: string, sessionId: string, appName?: string): Promise<SessionData> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          ...(appName || this.config.defaultAppName) && { app_name: appName || this.config.defaultAppName },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to get session: ${error.error || response.statusText}`
        );
      }

      const data = await response.json();
      return data.output;
    } catch (error) {
      console.error("Get Session Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get session"
      );
    }
  }

  /**
   * List all sessions for a user
   * @param userId - The user ID
   * @returns Promise<SessionData[]>
   */
  async listSessions(userId: string): Promise<SessionData[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to list sessions: ${error.error || response.statusText}`
        );
      }

      const data = await response.json();
      return data.output?.sessions || [];
    } catch (error) {
      console.error("List Sessions Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to list sessions"
      );
    }
  }

  /**
   * Delete a session
   * @param userId - The user ID
   * @param sessionId - The session ID
   * @param appName - Optional app name (for Cloud Run deployments)
   */
  async deleteSession(userId: string, sessionId: string, appName?: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          ...(appName || this.config.defaultAppName) && { app_name: appName || this.config.defaultAppName },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to delete session: ${error.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Delete Session Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete session"
      );
    }
  }

  /**
   * Send a chat message with streaming support
   * @param request - Chat request parameters
   * @param onEvent - Callback function for each streamed event (text, functionCall, functionResponse)
   * @returns Promise<string> - The complete response text
   */
  async sendMessage(
    request: ChatRequest,
    onEvent?: (chunk: string, invocationId: string, type: 'text' | 'functionCall' | 'functionResponse', eventData: any) => void,
  ): Promise<string> {
    try {
      // Add default app_name if configured and not provided in request
      const requestWithDefaults = {
        ...request,
        ...(this.config.defaultAppName && !request.app_name) && { app_name: this.config.defaultAppName },
      };

      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestWithDefaults),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `Failed to send message: ${error.error || response.statusText}`
        );
      }

      // Handle streaming response
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events: data: {...}\n\n
        const messages = buffer.split('\n\n');
        // Keep the last partial message in the buffer
        buffer = messages.pop() || '';

        for (const message of messages) {
          const trimmed = message.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr) continue;

          let data;
          try {
            data = JSON.parse(jsonStr);
          } catch (parseError) {
            console.warn("Failed to parse streaming chunk:", jsonStr, parseError);
            continue;
          }

          const invocationId = data.invocationId || 'default';

          // Determine event type and extract data
          let eventType: 'text' | 'functionCall' | 'functionResponse' | 'other' = 'other';
          let eventData: any = data;
          let textChunk = "";

          if (data.content && Array.isArray(data.content.parts)) {
            for (const part of data.content.parts) {
              if (part.text) {
                textChunk += part.text;
                eventType = 'text';
              }
              if (part.functionCall) {
                eventType = 'functionCall';
                eventData = part; // Use the part containing functionCall
                break; // A part can only be one type for our purposes
              }
              if (part.functionResponse) {
                eventType = 'functionResponse';
                eventData = part; // Use the part containing functionResponse
                break; // A part can only be one type for our purposes
              }
            }
          }
          // The server is also sending a 'toolCalls' array directly on the top-level event object
          // for tool call events. Prioritize this for a cleaner eventData.
          if (data.toolCalls && data.toolCalls.length > 0) {
            const toolCall = data.toolCalls[0]; // Assuming one toolCall per event for simplicity
            if (toolCall.status === 'calling') {
              eventType = 'functionCall';
              eventData = { functionCall: toolCall }; // Wrap to match client's expectation
            } else if (toolCall.status === 'complete') {
              eventType = 'functionResponse';
              eventData = { functionResponse: toolCall }; // Wrap to match client's expectation
            }
          }


          if (onEvent) {
            onEvent(textChunk, invocationId, eventType, eventData);
          }

          if (textChunk) {
            fullText += textChunk;
          }
        }
      }

      // Final processing for any remaining buffer (should mostly be empty for SSE)
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          const jsonStr = buffer.slice(6).trim();
          try {
            const data = JSON.parse(jsonStr);
            const invocationId = data.invocationId || 'default';
            let eventType: 'text' | 'functionCall' | 'functionResponse' | 'other' = 'other';
            let eventData: any = data;
            let textChunk = "";

            if (data.content && Array.isArray(data.content.parts)) {
              for (const part of data.content.parts) {
                if (part.text) {
                  textChunk += part.text;
                  eventType = 'text';
                }
                if (part.functionCall) {
                  eventType = 'functionCall';
                  eventData = part;
                  break;
                }
                if (part.functionResponse) {
                  eventType = 'functionResponse';
                  eventData = part;
                  break;
                }
              }
            }
            if (data.toolCalls && data.toolCalls.length > 0) {
              const toolCall = data.toolCalls[0];
              if (toolCall.status === 'calling') {
                eventType = 'functionCall';
                eventData = { functionCall: toolCall };
              } else if (toolCall.status === 'complete') {
                eventType = 'functionResponse';
                eventData = { functionResponse: toolCall };
              }
            }

            if (onEvent) {
              onEvent(textChunk, invocationId, eventType, eventData);
            }
            if (textChunk) {
              fullText += textChunk;
            }

          } catch (parseError) {
            console.warn("Failed to parse remaining buffer:", buffer, parseError);
          }
        }
      }


      return fullText;
    } catch (error) {
      console.error("Send Message Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    }
  }

  /**
   * Extract text from various content formats
   * @param content - Content object from Agent Engine
   * @returns Extracted text or empty string
   */
  private extractTextFromContent(content: any): string {
    if (typeof content === "string") {
      return content;
    }

    if (content && typeof content === "object") {
      // Handle parts array format
      if (Array.isArray(content.parts)) {
        return content.parts
          .map((part: any) => part.text || "")
          .filter(Boolean)
          .join("");
      }

      // Handle direct text field
      if (content.text) {
        return content.text;
      }

      // Handle nested content
      if (content.content) {
        return this.extractTextFromContent(content.content);
      }
    }

    return "";
  }

  /**
   * Parse remaining buffer content
   * @param buffer - Buffer string
   * @returns Extracted text
   */
  private parseRemainingBuffer(buffer: string): string {
    try {
      const data = JSON.parse(buffer);
      return this.extractTextFromContent(data);
    } catch {
      return buffer.trim();
    }
  }

  /**
   * Check proxy server health
   * @returns Promise<boolean>
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate a unique session ID
   * @returns A unique session ID string
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique user ID
   * @returns A unique user ID string
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
