import { useNotificationEngine } from '@/hooks/useNotificationEngine';
import { useAdsBudgetNotifications } from '@/hooks/useAdsBudgetNotifications';

export function NotificationEngineHost() {
  useNotificationEngine();
  useAdsBudgetNotifications();
  return null;
}
