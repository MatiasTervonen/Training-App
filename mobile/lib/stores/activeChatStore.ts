let activeConversationId: string | null = null;

export function setActiveChatId(id: string | null) {
  activeConversationId = id;
}

export function getActiveChatId() {
  return activeConversationId;
}
