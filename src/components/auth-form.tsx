import { Wordmark } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { AuthError, useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { SUPABASE_CONFIGURED } from '@/lib/supabase-config';
import { router } from 'expo-router';
import { Eye, EyeOff, X } from 'lucide-react-native';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Username + password form shared by the sign-in and sign-up screens. */
export function AuthForm({ mode }: { mode: 'signIn' | 'signUp' }) {
  const { t } = useI18n();
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const isSignUp = mode === 'signUp';

  const messages: Record<string, string> = {
    invalidUsername: t.errInvalidUsername,
    passwordTooShort: t.errPasswordTooShort,
    usernameTaken: t.errUsernameTaken,
    wrongCredentials: t.errWrongCredentials,
    network: t.errNetwork,
  };

  const submit = async () => {
    if (!SUPABASE_CONFIGURED) return setError(t.notConfigured);
    if (!username.trim() || !password) return setError(isSignUp ? t.errInvalidUsername : t.errWrongCredentials);
    setBusy(true);
    setError(undefined);
    try {
      await (isSignUp ? signUp(username, password) : signIn(username, password));
      // The route guard closes this screen once the session exists.
    } catch (e) {
      setError(e instanceof AuthError ? messages[e.code] : t.errGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="bg-background flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
      >
        <View className="items-end">
          <Pressable
            hitSlop={10}
            accessibilityLabel={t.close}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            className="bg-secondary rounded-full p-2"
          >
            <Icon as={X} size={20} />
          </Pressable>
        </View>

        <View className="flex-1 justify-center gap-8 py-8">
          <View className="gap-2">
            <Wordmark size="xl" />
            <Text className="text-start text-2xl font-bold">{isSignUp ? t.signUpTitle : t.signInTitle}</Text>
            <Text className="text-muted-foreground text-start">{isSignUp ? t.signUpSubtitle : t.signInSubtitle}</Text>
          </View>

          <View className="gap-4">
            <View className="gap-1.5">
              <Label className="text-start">{t.username}</Label>
              <Input
                value={username}
                onChangeText={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())}
                placeholder={t.usernamePh}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                className="h-12 text-start"
                style={{ writingDirection: 'ltr' }}
                returnKeyType="next"
              />
              {isSignUp ? <Text className="text-muted-foreground text-start text-xs">{t.usernameHint}</Text> : null}
            </View>
            <View className="gap-1.5">
              <Label className="text-start">{t.password}</Label>
              <View className="justify-center">
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.passwordPh}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  textContentType={isSignUp ? 'newPassword' : 'password'}
                  className="h-12 pe-11 text-start"
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}
                  accessibilityLabel={t.password}
                  className="absolute end-3"
                >
                  <Icon as={showPassword ? EyeOff : Eye} size={18} className="text-muted-foreground" />
                </Pressable>
              </View>
            </View>

            {error ? <Text className="text-destructive text-start text-sm">{error}</Text> : null}

            <Button size="lg" className="h-12 rounded-full" disabled={busy} onPress={submit}>
              <Text className="text-base font-semibold">{isSignUp ? t.signUp : t.signIn}</Text>
            </Button>
          </View>

          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text className="text-muted-foreground">{isSignUp ? t.haveAccount : t.noAccount}</Text>
            <Pressable onPress={() => router.replace(isSignUp ? '/sign-in' : '/sign-up')} hitSlop={8}>
              <Text className="text-primary font-semibold">{isSignUp ? t.signIn : t.signUp}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
