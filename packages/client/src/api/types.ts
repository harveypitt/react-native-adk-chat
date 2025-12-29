export interface ADKConfig {
  baseUrl: string;
  appName: string;
}

export interface ButtonOption {
  id: string;
  label: string;
  value: string;
}

export interface Suggestion {
  text: string;
  value: string;
  confidence?: 'high' | 'medium' | 'low';
  source?: {
    tool: string;
    field: string;
  };
}

export interface SuggestionContent {
  suggestions: Suggestion[];
  reasoning?: string;
  questionType?: string;
}

export interface MessagePart {
  type: 'text' | 'buttons' | 'image' | 'citation';
  content?: string;
  buttons?: ButtonOption[];
  imageUrl?: string;
  citation?: {
    document: string;
    page?: number;
    url?: string;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: MessagePart[];
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: ToolCall[];
  suggestions?: SuggestionContent;
}

// ADK API Request Types
export interface MessagePart {
  text: string;
}

export interface ADKMessage {
  role: "user" | "model";
  parts: MessagePart[];
}

export interface ADKRunRequest {
  app_name: string;
  user_id: string;
  session_id: string;
  new_message: ADKMessage;
  streaming: boolean;
}

// ADK API Response Types
export interface TokenDetail {
  modality: string;
  tokenCount: number;
}

export interface UsageMetadata {
  candidatesTokenCount: number;
  candidatesTokensDetails: TokenDetail[];
  promptTokenCount: number;
  promptTokensDetails: TokenDetail[];
  thoughtsTokenCount?: number;
  totalTokenCount: number;
  trafficType: string;
}

export interface ContentPart {
  text: string;
  thoughtSignature?: string;
}

export interface Content {
  parts: ContentPart[];
  role: string;
}

export interface Actions {
  stateDelta: Record<string, any>;
  artifactDelta: Record<string, any>;
  requestedAuthConfigs: Record<string, any>;
  requestedToolConfirmations: Record<string, any>;
}

export interface ADKResponseItem {
  modelVersion: string;
  content: Content;
  finishReason: string;
  usageMetadata: UsageMetadata;
  avgLogprobs: number;
  invocationId: string;
  author: string;
  actions: Actions;
  id: string;
  timestamp: number;
}

export type ADKResponse = ADKResponseItem[];

// Session Management Types
export interface CreateSessionRequest {
  visit_count?: number;
}

export interface SessionData {
  user_id: string;
  session_id: string;
  app_name: string;
  created_at?: string;
  updated_at?: string;
  data?: Record<string, any>;
}
