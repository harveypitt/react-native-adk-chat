import {
  ADKConfig,
  ADKRunRequest,
  ADKResponse,
  ADKResponseItem,
  CreateSessionRequest,
  SessionData,
} from "./types";

export class ADKClient {
  private config: ADKConfig;

  constructor(config: ADKConfig) {
    this.config = config;
  }

  /**
   * Send a message to the ADK agent with streaming support
   * @param message - The user's message text
   * @param userId - The user ID
   * @param sessionId - The session ID
   * @param onChunk - Callback function called for each streamed chunk
   * @returns Promise<string> - The complete response text
   */
  async sendMessage(
    message: string,
    userId: string,
    sessionId: string,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    try {
      const requestBody: ADKRunRequest = {
        app_name: this.config.appName,
        user_id: userId,
        session_id: sessionId,
        new_message: {
          role: "user",
          parts: [{ text: message }],
        },
        streaming: true,
      };

      const response = await fetch(`${this.config.baseUrl}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `ADK API error: ${response.status} ${response.statusText}`,
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

        // Process complete lines (newline-delimited JSON)
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: ADKResponse = JSON.parse(line);

              // Extract text from the response
              for (const item of data) {
                if (item.content && item.content.parts) {
                  for (const part of item.content.parts) {
                    if (part.text) {
                      fullText += part.text;

                      // Call the chunk callback if provided
                      if (onChunk) {
                        onChunk(part.text);
                      }
                    }
                  }
                }
              }
            } catch (parseError) {
              console.warn("Failed to parse JSON line:", line, parseError);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const data: ADKResponse = JSON.parse(buffer);
          for (const item of data) {
            if (item.content && item.content.parts) {
              for (const part of item.content.parts) {
                if (part.text) {
                  fullText += part.text;
                  if (onChunk) {
                    onChunk(part.text);
                  }
                }
              }
            }
          }
        } catch (parseError) {
          console.warn("Failed to parse remaining buffer:", buffer, parseError);
        }
      }

      return fullText;
    } catch (error) {
      console.error("ADK Client Error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to send message to ADK agent",
      );
    }
  }

  /**
   * Create a new session
   * @param userId - The user ID
   * @param sessionId - The session ID
   * @param data - Optional session data
   */
  async createSession(
    userId: string,
    sessionId: string,
    data?: CreateSessionRequest,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/apps/${this.config.appName}/users/${userId}/sessions/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data || {}),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create session: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Create Session Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create session",
      );
    }
  }

  /**
   * Get session data
   * @param userId - The user ID
   * @param sessionId - The session ID
   */
  async getSession(userId: string, sessionId: string): Promise<SessionData> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/apps/${this.config.appName}/users/${userId}/sessions/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get session: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Get Session Error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get session",
      );
    }
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
