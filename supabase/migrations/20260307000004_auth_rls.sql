-- Update RLS policies to support authenticated users while preserving anonymous access

DROP POLICY IF EXISTS "Allow all on surf_sessions" ON surf_sessions;
DROP POLICY IF EXISTS "Allow all on user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow all on spot_preferences" ON spot_preferences;
DROP POLICY IF EXISTS "Allow all on surfboards" ON surfboards;

CREATE POLICY "Users access own sessions" ON surf_sessions
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users access own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users access own preferences" ON spot_preferences
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users access own surfboards" ON surfboards
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
