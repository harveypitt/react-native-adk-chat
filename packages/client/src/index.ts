// High-level Components (recommended for most users)
export { ChatApp } from "./components/ChatApp";
export type { ChatAppProps } from "./components/ChatApp";

export { ChatScreen } from "./components/ChatScreen";
export type { ChatScreenProps } from "./components/ChatScreen";

// Individual Components (for custom layouts)
export { ChatHeader } from "./components/ChatHeader";
export type { ChatHeaderProps } from "./components/ChatHeader";

export { ChatMessageList } from "./components/ChatMessageList";
export type { ChatMessageListProps } from "./components/ChatMessageList";

export { default as ChatInput } from "./components/ChatInput";
export type { ChatInputProps } from "./components/ChatInput";

export { default as MessageBubble } from "./components/MessageBubble";
export type { Message, MessageBubbleProps, ToolCall } from "./components/MessageBubble";

export { ButtonGroup } from "./components/ButtonGroup";
export type { ButtonGroupProps } from "./components/ButtonGroup";

export { SuggestionChips } from "./components/SuggestionChips";
export type { SuggestionChipsProps } from "./components/SuggestionChips";

export { SuggestionContainer } from "./components/SuggestionContainer";
export type { SuggestionContainerProps } from "./components/SuggestionContainer";

export { default as ToolResponseDebugScreen } from "./components/ToolResponseDebugScreen";

// Hooks
export * from "./hooks";

// Theme
export * from "./theme";

// API Clients
export { ADKClient } from "./api/adkClient";
export { ProxyClient, parseButtonOptions } from "./api/proxyClient";

// Types
export type {
  ADKConfig,
  ADKRunRequest,
  ADKResponse,
  ADKResponseItem,
  CreateSessionRequest,
  SessionData,
  ButtonOption,
  Suggestion,
  SuggestionContent,
  MessagePart,
} from "./api/types";

export type {
  ProxyConfig,
  CreateSessionResponse,
  ListSessionsResponse,
  ChatRequest,
} from "./api/proxyClient";
