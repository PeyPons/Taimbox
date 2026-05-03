import { Menu, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useImpersonationStatus } from "@/components/admin/ImpersonationBanner";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { isImpersonating } = useImpersonationStatus();
    return (
        <header
            className={cn(
                "fixed left-0 right-0 top-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:hidden z-40 transition-shadow duration-200",
                isImpersonating && "shadow-[inset_0_2px_0_0_#f59e0b]"
            )}
        >
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
                <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                    <LayoutDashboard className="h-4 w-4 text-white" />
                </div>
                <span>Taimbox</span>
            </div>

            <div className="flex items-center gap-1">
                <NotificationBell />
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </div>
        </header>
    );
}
