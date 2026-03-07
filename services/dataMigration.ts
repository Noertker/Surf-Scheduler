import { supabase } from './supabase';

/**
 * Claims all anonymous (user_id = null) data for the newly authenticated user.
 * Called once on first sign-in.
 */
export async function claimAnonymousData(userId: string): Promise<void> {
  const tables = ['surf_sessions', 'user_settings', 'spot_preferences', 'surfboards'];

  for (const table of tables) {
    await supabase
      .from(table)
      .update({ user_id: userId })
      .is('user_id', null);
  }
}
