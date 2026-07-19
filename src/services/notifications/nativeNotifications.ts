import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionAsked = false;

export async function configureNativeNotifications(requestPermission = false): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminder ZAID',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A855F7',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status !== 'granted' && (!requestPermission || permissionAsked)) return false;
  const permission = current.status === 'granted'
    ? current
    : await Notifications.requestPermissionsAsync();
  permissionAsked = true;
  return permission.status === 'granted';
}

export function addNotificationResponseListener(onReminder: (data: { reminderId?: string; taskId?: string | null; calendarEventId?: string | null }) => void) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown>;
    onReminder({
      reminderId: typeof data.reminderId === 'string' ? data.reminderId : undefined,
      taskId: typeof data.taskId === 'string' ? data.taskId : null,
      calendarEventId: typeof data.calendarEventId === 'string' ? data.calendarEventId : null,
    });
  });
}

type AppReminder = {
  id: string;
  remind_at: string;
  status: string;
  channel: string;
  task_id: string | null;
  calendar_event_id: string | null;
  task?: { title?: string } | null;
  calendar_event?: { title?: string } | null;
};

export async function syncAppReminderNotifications(reminders: AppReminder[]) {
  if (!(await configureNativeNotifications(false))) return;

  const appReminders = reminders.filter((reminder) =>
    reminder.status === 'pending' && reminder.channel !== 'whatsapp'
  );
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const validIds = new Set(appReminders.map((reminder) => reminder.id));

  for (const notification of scheduled) {
    const reminderId = notification.content.data?.reminderId;
    if (typeof reminderId === 'string' && !validIds.has(reminderId)) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  const scheduledIds = new Set(scheduled.map((notification) => notification.content.data?.reminderId));
  for (const reminder of appReminders) {
    const date = new Date(reminder.remind_at);
    if (date <= new Date() || scheduledIds.has(reminder.id)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder ZAID',
        body: `${reminder.task?.title || reminder.calendar_event?.title || 'Jadwal kamu'} sebentar lagi dimulai.`,
        data: {
          reminderId: reminder.id,
          taskId: reminder.task_id,
          calendarEventId: reminder.calendar_event_id,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: 'reminders',
      },
    });
  }
}

export async function requestReminderPermission() {
  return configureNativeNotifications(true);
}
