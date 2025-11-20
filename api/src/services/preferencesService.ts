import { prisma } from '../utils/prisma.js';

const defaultPrefs = {
  preferredLanguage: 'en',
  responseStyle: 'balanced'
};

export const getPreferences = async (userId: string) => {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (prefs) return prefs;
  return prisma.userPreference.create({ data: { userId, ...defaultPrefs } });
};

export const updatePreferences = async (userId: string, payload: any) => {
  const existing = await prisma.userPreference.findUnique({ where: { userId } });
  if (existing) {
    return prisma.userPreference.update({
      where: { userId },
      data: {
        ...('preferredLanguage' in payload ? { preferredLanguage: payload.preferredLanguage } : {}),
        ...('responseStyle' in payload ? { responseStyle: payload.responseStyle } : {})
      }
    });
  }
  return prisma.userPreference.create({
    data: {
      userId,
      preferredLanguage: payload.preferredLanguage ?? defaultPrefs.preferredLanguage,
      responseStyle: payload.responseStyle ?? defaultPrefs.responseStyle
    }
  });
};
