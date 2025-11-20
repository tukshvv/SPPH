import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { ensureUser } from './analyticsService.js';

export interface ScheduleItem {
  id: string;
  title: string;
  day: string;
  time: string;
  location?: string;
  description?: string;
}

export interface UserProfilePayload {
  major?: string | null;
  topics: string[];
  level?: string | null;
  schedule: ScheduleItem[];
}

const parseJsonArray = <T>(value: string | null | undefined): T[] => {
  if (!value) return [] as T[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [] as T[];
  }
};

const encodeArray = (value: unknown[]) => JSON.stringify(value ?? []);

const normalizeTopics = (topics?: string[]) => {
  if (!topics) return undefined;
  const cleaned = topics.map((topic) => topic.trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
};

const normalizeSchedule = (schedule?: ScheduleItem[]) => {
  if (!schedule) return undefined;
  return schedule
    .map((entry) => ({
      ...entry,
      id: entry.id?.trim() || randomUUID(),
      title: entry.title.trim(),
      day: entry.day.trim(),
      time: entry.time.trim(),
      location: entry.location?.trim() || undefined,
      description: entry.description?.trim() || undefined
    }))
    .filter((entry) => entry.title && entry.day && entry.time);
};

const mapProfile = (record: { major: string | null; level: string | null; topics: string; schedule: string }) => ({
  major: record.major,
  level: record.level,
  topics: parseJsonArray<string>(record.topics),
  schedule: parseJsonArray<ScheduleItem>(record.schedule)
});

export const getUserProfile = async (userId: string): Promise<UserProfilePayload> => {
  await ensureUser(userId);
  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      topics: encodeArray([]),
      schedule: encodeArray([])
    },
    update: {}
  });

  return mapProfile(profile);
};

export const updateUserProfile = async (
  userId: string,
  patch: Partial<Omit<UserProfilePayload, 'schedule'>> & { schedule?: ScheduleItem[] }
): Promise<UserProfilePayload> => {
  await ensureUser(userId);
  const topics = normalizeTopics(patch.topics);
  const schedule = normalizeSchedule(patch.schedule);

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      major: patch.major,
      level: patch.level,
      topics: encodeArray(topics ?? []),
      schedule: encodeArray(schedule ?? [])
    },
    update: {
      major: patch.major ?? undefined,
      level: patch.level ?? undefined,
      topics: topics ? encodeArray(topics) : undefined,
      schedule: schedule ? encodeArray(schedule) : undefined
    }
  });

  return mapProfile(profile);
};
