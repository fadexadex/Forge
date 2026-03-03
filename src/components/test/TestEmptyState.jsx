export function TestEmptyState({ icon, heading, subtitle }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">{heading}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
