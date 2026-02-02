import React from "react";

interface FullScreenProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function FullScreen({ children, className = "" }: FullScreenProps) {
  return (
    <div
      className={`w-screen h-dvh min-h-dvh flex items-center justify-center border ${className}`}
    >
      {children}
    </div>
  );
}

export default FullScreen;
