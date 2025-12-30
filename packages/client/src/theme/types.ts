export interface ChatTheme {
  // Primary colors
  primaryColor?: string;
  backgroundColor?: string;

  // Message bubble colors
  userMessageBackground?: string;
  userMessageText?: string;
  aiMessageBackground?: string;
  aiMessageText?: string;
  aiMessageBorder?: string;

  // Input colors
  inputBackground?: string;
  inputBorder?: string;
  inputText?: string;
  sendButtonColor?: string;
  sendButtonDisabled?: string;

  // Header colors
  headerBackground?: string;
  headerText?: string;
  headerBorder?: string;
  statusConnected?: string;
  statusDisconnected?: string;

  // Suggestion colors
  suggestionBorder?: string;
  suggestionText?: string;
  suggestionSelectedBackground?: string;
  suggestionSelectedText?: string;

  // Confidence badge colors
  confidenceHigh?: string;
  confidenceMedium?: string;
  confidenceLow?: string;

  // Tool call colors
  toolCallBackground?: string;
  toolCallBorder?: string;
  toolCallText?: string;

  // Utility colors
  emptyStateIcon?: string;
  emptyStateText?: string;
  errorColor?: string;
  loadingColor?: string;
}

export type ChatThemeWithDefaults = Required<ChatTheme>;
