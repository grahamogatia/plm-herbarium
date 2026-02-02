interface FullScreenProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  background?: string;
}

function FullScreen({
  children,
  className = "",
  background,
}: FullScreenProps) {
  return (
    <div
      style={
        background
          ? { backgroundImage: `url(${background})` }
          : undefined
      }
      className={`w-screen min-h-[calc(100dvh-56px)]
      flex items-center justify-center bg-cover bg-center bg-no-repeat ${className}`}
    >
      {children}
    </div>
  );
}


export default FullScreen;