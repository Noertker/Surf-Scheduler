import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Text } from '@/components/shared/Text';
import { View } from '@/components/shared/View';
import { useAuthStore } from '@/stores/useAuthStore';
import { useColors } from '@/hooks/useColors';
import { ThemeColors } from '@/constants/theme';
import { KairoLogo } from '@/components/shared/KairoLogo';

const PAGES = 3;

const FEATURES = [
  {
    title: 'Automatically see your ideal surf windows',
    body: 'Select your beaches, set your ideal tide range, and see exactly when conditions align for your level.',
  },
  {
    title: 'Schedule & sync',
    body: 'Book sessions from the forecast, sync to Google Calendar, and log detailed feedback after every surf.',
  },
  {
    title: 'Get coached',
    body: 'Build your surfer profile and get AI-powered board picks, session priorities, and progression tracking.',
  },
];

export function AuthScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Auth form state
  const { loading, authError, signUp, signInWithEmail, signInWithGoogle } =
    useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(x / screenWidth);
    if (newPage !== page) setPage(newPage);
  };

  const goToPage = (p: number) => {
    scrollRef.current?.scrollTo({ x: p * screenWidth, animated: true });
    setPage(p);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup') {
      await signUp(email.trim(), password);
    } else {
      await signInWithEmail(email.trim(), password);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Page 1 — Hero */}
        <View style={[styles.page, { width: screenWidth }]}>
          <View style={styles.heroContent}>
            <KairoLogo size={100} />
            <Text style={styles.heroTitle}>
              <Text style={styles.heroTitleKairos}>Kairos</Text>
              <Text style={styles.heroTitleUrf}>urf</Text>
            </Text>
            <Text style={styles.heroTagline}>More time surfing,{'\n'}less time forecasting</Text>
            <Text style={styles.heroSubtitle}>
              The only surf forecasting app focused on getting you in the water
              at the right time for your progression.
            </Text>
            <Pressable style={styles.ctaButton} onPress={() => goToPage(1)}>
              <Text style={styles.ctaText}>See how it works</Text>
            </Pressable>
          </View>
        </View>

        {/* Page 2 — Features */}
        <View style={[styles.page, { width: screenWidth }]}>
          <View style={styles.featuresContent}>
            <Text style={styles.featuresHeading}>Everything you need</Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureNumber}>{i + 1}</Text>
                <View style={styles.featureTextBlock}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
            <Pressable style={styles.ctaButton} onPress={() => goToPage(2)}>
              <Text style={styles.ctaText}>Get started</Text>
            </Pressable>
          </View>
        </View>

        {/* Page 3 — Auth */}
        <View style={[styles.page, { width: screenWidth }]}>
          <ScrollView
            contentContainerStyle={styles.authContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.authHeading}>
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.authSubheading}>
              {mode === 'signup'
                ? 'Start tracking your sessions and progression.'
                : 'Sign in to pick up where you left off.'}
            </Text>

            {authError && <Text style={styles.error}>{authError}</Text>}

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textDim}
              secureTextEntry
            />

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {loading
                  ? 'Loading...'
                  : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              style={styles.switchMode}
            >
              <Text style={styles.switchModeText}>
                {mode === 'signin'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={signInWithGoogle}
              disabled={loading}
              style={styles.googleButton}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
            <Text style={styles.hint}>
              Google sign-in also connects Calendar sync
            </Text>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {Array.from({ length: PAGES }).map((_, i) => (
          <Pressable key={i} onPress={() => goToPage(i)} hitSlop={8}>
            <View
              style={[styles.dot, i === page && styles.dotActive]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    page: {
      flex: 1,
    },

    // Hero
    heroContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      backgroundColor: 'transparent',
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    heroTitleKairos: {
      color: '#0284c7',
    },
    heroTitleUrf: {
      color: '#38bdf8',
    },
    heroTagline: {
      fontSize: 22,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 30,
      marginBottom: 16,
    },
    heroSubtitle: {
      fontSize: 17,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
      maxWidth: 360,
      marginBottom: 40,
    },

    // Features
    featuresContent: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'transparent',
    },
    featuresHeading: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 28,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
    },
    featureNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      width: 32,
      marginTop: 2,
    },
    featureTextBlock: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    featureBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // Shared CTA
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 40,
      alignSelf: 'center',
      marginTop: 24,
    },
    ctaText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },

    // Auth form
    authContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingBottom: 60,
    },
    authHeading: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    authSubheading: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
    },
    error: {
      fontSize: 13,
      color: colors.error ?? '#ef4444',
      marginBottom: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: colors.cardAlt,
      overflow: 'hidden',
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.cardAlt,
      marginBottom: 12,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    switchMode: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    switchModeText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
      backgroundColor: 'transparent',
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 12,
      color: colors.textDim,
      paddingHorizontal: 12,
    },
    googleButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 12,
      backgroundColor: colors.cardAlt,
      maxWidth: 400,
      alignSelf: 'center',
      width: '100%',
    },
    googleButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    hint: {
      fontSize: 12,
      color: colors.textDim,
      textAlign: 'center',
      marginTop: 10,
    },

    // Dots
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      paddingBottom: 36,
      backgroundColor: 'transparent',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textDim,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 24,
    },
  });
