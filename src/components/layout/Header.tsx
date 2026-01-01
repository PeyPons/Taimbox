import { Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:hidden z-40">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
                <div className="h-7 w-7 rounded bg-indigo-600 flex items-center justify-center">
                    <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <span>Timeboxing</span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
                <Menu className="h-6 w-6" />
            </Button>
        </header>
    );
}
