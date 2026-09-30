import React from 'react';
import { ChatWindow } from '../components/ChatWindow';

export const ChatPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ChatWindow />
    </div>
  );
};
