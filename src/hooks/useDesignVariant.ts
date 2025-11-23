import { useSiteSettingsStore } from '../store/siteSettingsStore';

export type DesignVariant = 'default' | 'alternative';

export const useDesignVariant = (): DesignVariant => {
  const { settings } = useSiteSettingsStore();
  return settings.designVariant || 'default';
};
