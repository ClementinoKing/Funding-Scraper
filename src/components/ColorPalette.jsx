const COLORS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
];

export default function ColorPalette() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {COLORS.map((name) => (
        <div
          key={name}
          className="rounded-md border bg-card text-card-foreground overflow-hidden"
        >
          <div
            className="h-20 w-full"
            style={{ background: `hsl(var(--${name}))` }}
          />
          <div className="p-2 text-xs">
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground font-mono">
              hsl(var(--{name}))
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
