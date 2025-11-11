/**
 * ADK Proxy Client
 * Client for interacting with the ADK Agent Proxy Service
 * which handles OAuth authentication with Google Agent Engine
 */

export interface ProxyConfig {
  baseUrl: string; // e.g., "http://localhost:3000" or "https://your-proxy.vercel.app"
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
  run_config?: Record<string, any>;
}

export interface ToolCallInfo {
  name: string;
  status: 'calling' | 'complete';
  args?: any;
}

export class ProxyClient {
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = config;
  }

  /**
   * Create a new session for a user
   * @param userId - The user ID
   * @param sessionId - Optional custom session ID (auto-generated if not provided)
   * @returns Promise<CreateSessionResponse>
   */
  async createSession(
    userId: string,
    sessionId?: string
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
   * @returns Promise<SessionData>
   */
  async getSession(userId: string, sessionId: string): Promise<SessionData> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
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
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/sessions/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
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
   * @param onChunk - Callback function for each streamed chunk
   * @param onToolCall - Callback function for tool calls
   * @returns Promise<string> - The complete response text
   */
  async sendMessage(
    request: ChatRequest,
    onChunk?: (chunk: string) => void,
    onToolCall?: (toolName: string, status: 'calling' | 'complete', args?: any) => void
  ): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
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

        // Try to parse complete JSON objects
        // The Agent Engine sends newline-delimited JSON
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            // Extract text from Agent Engine format: content.parts[].text
            if (data.content && data.content.parts) {
              // Check for tool calls
              for (const part of data.content.parts) {
                if (part.function_call && onToolCall) {
                  onToolCall(part.function_call.name, 'calling', part.function_call.args);
                } else if (part.function_response && onToolCall) {
                  onToolCall(part.function_response.name, 'complete', part.function_response.response);
                }
              }

              const text = data.content.parts
                .map((part: any) => part.text || "")
                .filter(Boolean)
                .join("");

              if (text) {
                fullText += text;
                if (onChunk) {
                  onChunk(text);
                }
              }
            }
          } catch (parseError) {
            console.warn("Failed to parse streaming chunk:", trimmed, parseError);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer);
          if (data.content && data.content.parts) {
            // Check for tool calls in remaining buffer
            for (const part of data.content.parts) {
              if (part.function_call && onToolCall) {
                onToolCall(part.function_call.name, 'calling', part.function_call.args);
              } else if (part.function_response && onToolCall) {
                onToolCall(part.function_response.name, 'complete', part.function_response.response);
              }
            }

            const text = data.content.parts
              .map((part: any) => part.text || "")
              .filter(Boolean)
              .join("");

            if (text) {
              fullText += text;
              if (onChunk) {
                onChunk(text);
              }
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse remaining buffer:", buffer, parseError);
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
