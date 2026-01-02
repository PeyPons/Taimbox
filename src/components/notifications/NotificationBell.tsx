
import { Bell, Check, Trash2, Info, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'assignment': return <Info className="h-4 w-4 text-blue-500" />;
            case 'deadline': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'budget': return <DollarSign className="h-4 w-4 text-red-500" />;
            case 'weekly': return <Calendar className="h-4 w-4 text-purple-500" />;
            default: return <Info className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
                        // Alternative: Number badge
                        // <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold">{unreadCount}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={markAllAsRead} title="Marcar todas como leídas">
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearNotifications} title="Borrar todas">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 space-y-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3",
                                        !notification.read && "bg-blue-50/50 hover:bg-blue-50"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className={cn("text-sm font-medium leading-none", !notification.read ? "text-slate-900" : "text-slate-600")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {formatDistanceToNow(notification.date, { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
