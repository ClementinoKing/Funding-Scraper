import ColorPalette from "@/components/ColorPalette";
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function Page() {
  return (
    <div className="p-6 space-y-6">
      <ThemeToggle />
      <ColorPalette />
    </div>
  );
}
