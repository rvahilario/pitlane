interface ScreenHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function ScreenHeader({ title, action }: ScreenHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {action}
    </div>
  );
}
