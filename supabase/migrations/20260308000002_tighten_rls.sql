-- Tighten RLS: allow reading anonymous rows (for migration), but all new writes must have a user_id

DROP POLICY IF EXISTS "Users access own sessions" ON surf_sessions;
DROP POLICY IF EXISTS "Users access own settings" ON user_settings;
DROP POLICY IF EXISTS "Users access own preferences" ON spot_preferences;
DROP POLICY IF EXISTS "Users access own surfboards" ON surfboards;
DROP POLICY IF EXISTS "Users access own profile" ON surfer_profiles;

-- Read: own rows + unclaimed anonymous rows
-- Write: own rows only (must be authenticated)
CREATE POLICY "Users access own sessions" ON surf_sessions
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users access own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users access own preferences" ON spot_preferences
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users access own surfboards" ON surfboards
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users access own profile" ON surfer_profiles
  FOR ALL USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
