import { useNotificationEngine } from '@/hooks/useNotificationEngine';

export function NotificationEngineHost() {
  useNotificationEngine();
  return null;
}
