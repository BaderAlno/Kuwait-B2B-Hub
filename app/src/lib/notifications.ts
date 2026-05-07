import { readDB, writeDB, generateId } from './db';

interface CreateNotifOpts {
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string;
  iconType?: string;
}

export function createNotification(opts: CreateNotifOpts) {
  try {
    const db = readDB();
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
      id: generateId('notif'),
      user_id: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      read: false,
      action_url: opts.actionUrl,
      icon_type: opts.iconType ?? 'info',
      created_at: new Date().toISOString(),
    });
    writeDB(db);
  } catch {
    // non-fatal — never crash a request because of a notification failure
  }
}

export function createNotificationForMany(userIds: string[], opts: Omit<CreateNotifOpts, 'userId'>) {
  try {
    const db = readDB();
    if (!db.notifications) db.notifications = [];
    for (const userId of userIds) {
      db.notifications.push({
        id: generateId('notif'),
        user_id: userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        read: false,
        action_url: opts.actionUrl,
        icon_type: opts.iconType ?? 'info',
        created_at: new Date().toISOString(),
      });
    }
    writeDB(db);
  } catch {
    // non-fatal
  }
}
