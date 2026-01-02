
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useApp } from './AppContext';
import { useAgency } from './AgencyContext';
import { Project, Allocation, Deadline } from '@/types';
import { differenceInDays, endOfMonth, isFriday, getHours } from 'date-fns';

export interface Notification {
    id: string;
    type: 'assignment' | 'deadline' | 'budget' | 'weekly' | 'info';
    title: string;
    message: string;
    date: Date;
    read: boolean;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
    simulateNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { currentUser, allocations, projects } = useApp();
    const { currentAgency } = useAgency();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Load notifications from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert dates back to Date objects
                setNotifications(parsed.map((n: any) => ({ ...n, date: new Date(n.date) })));
            } catch (e) {
                console.error("Error loading notifications", e);
            }
        }
    }, []);

    // Persist notifications
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    const addNotification = (n: Omit<Notification, 'id' | 'date' | 'read'>) => {
        const newNotif: Notification = {
            ...n,
            id: crypto.randomUUID(),
            date: new Date(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    // --- POLLING LOGIC ---

    // 1. Budget Overrun (For Managers/Admins only) 
    // Let's assume Managers or the project owner/lead.
    // For now, if user role is Responsable or Coordinador.
    useEffect(() => {
        if (!currentUser || !['Responsable', 'Coordinador'].includes(currentUser.role)) return;

        const notifiedKey = `budget_alert_projects`;
        const notifiedIdsStr = localStorage.getItem(notifiedKey);
        let notifiedIds: string[] = notifiedIdsStr ? JSON.parse(notifiedIdsStr) : [];
        let newNotifiedIds: string[] = [];
        let hasChanges = false;

        projects.forEach(p => {
            // Calculate total hours actual (naive calculation needs allocation aggregation or use p.deliverables_log logic? 
            // Actually AppContext might not have real-time hours actual on project object if it's not computed.
            // But let's assume updateProject updates p.hoursActual if it exists?
            // Checking Project type... contains budgetHours, but hoursActual is NOT on Project interface in types/index.ts.
            // OK, I'll skip budget calculation for now as I missed the 'hoursActual' prop in Project type validation.
            // It's expensive to aggregate all allocations here.
            // I will skip this feature for now to avoid specific overhead or implement it if I can sum allocations easily.
            // Let's sum allocations for active projects.

            if (p.status !== 'active') return;

            // Naive sum of all allocations for this project
            const projectAllocations = allocations.filter(a => a.projectId === p.id);
            const totalUsed = projectAllocations.reduce((acc, curr) => acc + (curr.hoursActual || 0), 0);

            if (totalUsed > p.budgetHours && !notifiedIds.includes(p.id)) {
                addNotification({
                    type: 'budget',
                    title: 'Horas Superadas',
                    message: `El proyecto ${p.name} ha superado las horas presupuestadas (${totalUsed.toFixed(1)}h de ${p.budgetHours}h).`,
                    link: '/projects'
                });
                newNotifiedIds.push(p.id);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            localStorage.setItem(notifiedKey, JSON.stringify([...notifiedIds, ...newNotifiedIds]));
        }

    }, [projects, allocations, currentUser]);

    // 2. Weekly Reminder (Miércoles-Viernes si hay tareas pendientes)
    useEffect(() => {
        if (!currentUser) return;

        const checkWeekly = () => {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes

            // Solo recordar de miércoles (3) a viernes (5)
            if (dayOfWeek < 3 || dayOfWeek > 5) return;

            const lastRemindedStr = localStorage.getItem('last_weekly_reminder');
            const lastReminded = lastRemindedStr ? new Date(lastRemindedStr) : null;

            // Check if already reminded today
            const alreadyRemindedToday = lastReminded &&
                lastReminded.getDate() === now.getDate() &&
                lastReminded.getMonth() === now.getMonth() &&
                lastReminded.getFullYear() === now.getFullYear();

            if (alreadyRemindedToday) return;

            // Check if there are pending tasks for current week
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
            startOfWeek.setHours(0, 0, 0, 0);

            const weekStartStr = startOfWeek.toISOString().split('T')[0];

            const pendingTasks = allocations.filter(a =>
                a.employeeId === currentUser.id &&
                a.weekStartDate === weekStartStr &&
                a.status === 'planned' &&
                (!a.hoursActual || a.hoursActual === 0)
            );

            if (pendingTasks.length > 0) {
                const dayName = dayOfWeek === 3 ? 'miércoles' : dayOfWeek === 4 ? 'jueves' : 'viernes';
                addNotification({
                    type: 'weekly',
                    title: 'Cierre Semanal Pendiente',
                    message: `Tienes ${pendingTasks.length} tarea(s) abiertas de esta semana. Recuerda cerrarlas y actualizar las horas trabajadas.`,
                    link: '/weekly-forecast'
                });
                localStorage.setItem('last_weekly_reminder', now.toISOString());
            }
        };

        checkWeekly();
        const interval = setInterval(checkWeekly, 2 * 60 * 60 * 1000); // Check every 2 hours
        return () => clearInterval(interval);
    }, [allocations, currentUser]);

    // 4. Deadlines (3 days before end of month)
    useEffect(() => {
        const checkDeadlines = () => {
            const now = new Date();
            const currentMonthEnd = endOfMonth(now);
            const daysLeft = differenceInDays(currentMonthEnd, now);

            // Check if we are exactly 3 days away (or less, but ensuring we don't spam).
            // Strategy: "Deadline Alert Month YYYY-MM" key.
            const msgKey = `deadline_alert_${now.getFullYear()}_${now.getMonth()}`;
            const alreadyAlerted = localStorage.getItem(msgKey);

            if (daysLeft <= 3 && !alreadyAlerted) {
                addNotification({
                    type: 'deadline',
                    title: 'Deadline Próximo',
                    message: 'Quedan menos de 3 días para el cierre de mes. Revisa tus entregables.',
                    link: '/deadlines'
                });
                localStorage.setItem(msgKey, 'true');
            }
        };
        checkDeadlines();
        const interval = setInterval(checkDeadlines, 24 * 60 * 60 * 1000); // Check daily
        return () => clearInterval(interval);
    }, []);

    // Helpers
    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const simulateNotification = () => {
        const testTypes: Array<'deadline' | 'budget' | 'weekly' | 'info'> = ['deadline', 'budget', 'weekly', 'info'];
        const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];

        const messages = {
            deadline: { title: 'Deadline Próximo', message: 'El proyecto "Rediseño Web" vence en 2 días.' },
            budget: { title: 'Horas Superadas', message: 'El proyecto "App Mobile" ha superado las horas presupuestadas en un 15%.' },
            weekly: { title: 'Cierre Semanal Pendiente', message: 'Tienes tareas abiertas de esta semana. Recuerda cerrarlas y actualizar las horas.' },
            info: { title: 'Actualización', message: 'Nueva funcionalidad disponible en el sistema.' }
        };

        addNotification({
            type: randomType,
            title: messages[randomType].title,
            message: messages[randomType].message,
            link: '/dashboard'
        });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, simulateNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
