import AuthNotice from "@/components/auth/AuthNotice";
import AuthScreen from "@/components/auth/AuthScreen";
import AuthTextField from "@/components/auth/AuthTextField";
import {
    getClerkErrorMessage,
    getClerkFieldMessage,
    getClerkGlobalMessage,
    getUnsupportedAuthStateMessage,
    navigateAfterAuth,
    validateEmail,
    validateVerificationCode,
} from "@/lib/auth";
import { useSignIn } from "@clerk/expo";
import type { SignInSignalValue } from "@clerk/expo/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { clsx } from "clsx";
import { Pressable, Text, View } from "react-native";

type SignInHookState = {
    errors: SignInSignalValue["errors"];
    fetchStatus: SignInSignalValue["fetchStatus"];
    signIn: SignInSignalValue["signIn"] | null;
};

type NoticeState = {
    message: string;
    tone: "error" | "info";
} | null;

type LocalErrors = {
    code?: string;
    identifier?: string;
    password?: string;
};

const SignIn = () => {
    const router = useRouter();
    const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
    const { errors, fetchStatus, signIn } = useSignIn() as unknown as SignInHookState;

    const [identifier, setIdentifier] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [code, setCode] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [localErrors, setLocalErrors] = React.useState<LocalErrors>({});
    const [notice, setNotice] = React.useState<NoticeState>(null);

    if (!signIn) {
        return null;
    }

    const isSubmitting = fetchStatus === "fetching";
    const isVerificationStep = signIn.status === "needs_client_trust";
    const globalMessage = notice?.message || getClerkGlobalMessage(errors.global);
    const globalTone = notice?.tone || "error";

    const identifierError = localErrors.identifier || getClerkFieldMessage(errors.fields.identifier);
    const passwordError = localErrors.password || getClerkFieldMessage(errors.fields.password);
    const codeError = localErrors.code || getClerkFieldMessage(errors.fields.code);

    const clearFieldError = (field: keyof LocalErrors) => {
        setLocalErrors((current) => {
            if (!current[field]) {
                return current;
            }

            return {
                ...current,
                [field]: undefined,
            };
        });
    };

    const clearNotice = () => {
        if (notice) {
            setNotice(null);
        }
    };

    const finalizeSignIn = async () => {
        const { error } = await signIn.finalize({
            navigate: (params) => navigateAfterAuth({
                router,
                params,
                onSessionTask: (message) => setNotice({ message, tone: "error" }),
                returnTo,
            }),
        });

        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "We could not finish signing you in. Please try again.",
                tone: "error",
            });
        }
    };

    const handleSubmit = async () => {
        const nextErrors: LocalErrors = {};
        const normalizedIdentifier = identifier.trim().toLowerCase();

        clearNotice();

        if (!normalizedIdentifier) {
            nextErrors.identifier = "Enter your email address.";
        } else if (!validateEmail(normalizedIdentifier)) {
            nextErrors.identifier = "Enter a valid email address.";
        }

        if (!password) {
            nextErrors.password = "Enter your password.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setLocalErrors(nextErrors);
            return;
        }

        setLocalErrors({});

        const { error } = await signIn.password({
            emailAddress: normalizedIdentifier,
            password,
        });

        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "We could not sign you in with those details.",
                tone: "error",
            });
            return;
        }

        if (signIn.status === "complete") {
            await finalizeSignIn();
            return;
        }

        if (signIn.status === "needs_client_trust") {
            const emailCodeFactor = signIn.supportedSecondFactors?.find((factor) => factor.strategy === "email_code");

            if (!emailCodeFactor) {
                setNotice({
                    message: "This account needs a second verification method that is not available in this flow yet.",
                    tone: "error",
                });
                return;
            }

            const { error: emailCodeError } = await signIn.mfa.sendEmailCode();
            if (emailCodeError) {
                setNotice({
                    message: getClerkErrorMessage(emailCodeError) || "We could not send your verification code.",
                    tone: "error",
                });
                return;
            }

            setCode("");
            setNotice({
                message: "We sent a 6-digit code to your email to confirm this device.",
                tone: "info",
            });
            return;
        }

        setNotice({
            message: getUnsupportedAuthStateMessage(signIn.status),
            tone: "error",
        });
    };

    const handleVerify = async () => {
        const normalizedCode = code.trim();

        clearNotice();

        if (!validateVerificationCode(normalizedCode)) {
            setLocalErrors({ code: "Enter the 6-digit code from your email." });
            return;
        }

        setLocalErrors({});

        const { error } = await signIn.mfa.verifyEmailCode({ code: normalizedCode });
        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "That code could not be verified. Please try again.",
                tone: "error",
            });
            return;
        }

        if (signIn.status === "complete") {
            await finalizeSignIn();
            return;
        }

        setNotice({
            message: getUnsupportedAuthStateMessage(signIn.status),
            tone: "error",
        });
    };

    const handleResendCode = async () => {
        clearNotice();

        const { error } = await signIn.mfa.sendEmailCode();
        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "We could not resend your code right now.",
                tone: "error",
            });
            return;
        }

        setNotice({
            message: "A fresh verification code is on its way to your email.",
            tone: "info",
        });
    };

    const handleStartOver = async () => {
        await signIn.reset();
        setCode("");
        setLocalErrors({});
        setNotice(null);
    };

    return (
        <AuthScreen
            footerCopy="New to Recurly?"
            footerHref={returnTo ? { pathname: "/sign-up", params: { returnTo } } : "/sign-up"}
            footerLinkLabel="Create an account"
            subtitle={isVerificationStep
                ? "Confirm it’s really you so we can keep your billing data secure."
                : "Sign in to continue managing your subscriptions."}
            title={isVerificationStep ? "Verify your account" : "Welcome back"}
        >
            <View className="auth-form">
                <AuthNotice message={globalMessage} tone={globalTone} />

                {isVerificationStep ? (
                    <>
                        <Text className="auth-verify-copy">
                            Enter the 6-digit code we sent to {identifier.trim().toLowerCase()} to finish signing in on this device.
                        </Text>

                        <AuthTextField
                            autoCapitalize="none"
                            autoComplete="one-time-code"
                            error={codeError}
                            keyboardType="number-pad"
                            label="Verification code"
                            maxLength={6}
                            onChangeText={(value) => {
                                setCode(value.replace(/[^0-9]/g, ""));
                                clearFieldError("code");
                                clearNotice();
                            }}
                            placeholder="Enter your 6-digit code"
                            returnKeyType="done"
                            value={code}
                        />

                        <Pressable
                            className={clsx("auth-button", (!code.trim() || isSubmitting) && "auth-button-disabled")}
                            disabled={!code.trim() || isSubmitting}
                            onPress={handleVerify}
                        >
                            <Text className="auth-button-text">
                                {isSubmitting ? "Verifying..." : "Verify and continue"}
                            </Text>
                        </Pressable>

                        <Pressable className="auth-secondary-button" disabled={isSubmitting} onPress={handleResendCode}>
                            <Text className="auth-secondary-button-text">Send a new code</Text>
                        </Pressable>

                        <Pressable className="auth-secondary-button" disabled={isSubmitting} onPress={handleStartOver}>
                            <Text className="auth-secondary-button-text">Start over</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <AuthTextField
                            autoCapitalize="none"
                            autoComplete="email"
                            error={identifierError}
                            keyboardType="email-address"
                            label="Email"
                            onChangeText={(value) => {
                                setIdentifier(value);
                                clearFieldError("identifier");
                                clearNotice();
                            }}
                            placeholder="Enter your email"
                            returnKeyType="next"
                            value={identifier}
                        />

                        <AuthTextField
                            actionLabel={showPassword ? "Hide" : "Show"}
                            autoCapitalize="none"
                            autoComplete="current-password"
                            error={passwordError}
                            label="Password"
                            onActionPress={() => setShowPassword((current) => !current)}
                            onChangeText={(value) => {
                                setPassword(value);
                                clearFieldError("password");
                                clearNotice();
                            }}
                            placeholder="Enter your password"
                            returnKeyType="done"
                            secureTextEntry={!showPassword}
                            textContentType="password"
                            value={password}
                        />

                        <Pressable
                            className={clsx(
                                "auth-button",
                                (!identifier.trim() || !password || isSubmitting) && "auth-button-disabled",
                            )}
                            disabled={!identifier.trim() || !password || isSubmitting}
                            onPress={handleSubmit}
                        >
                            <Text className="auth-button-text">
                                {isSubmitting ? "Signing in..." : "Sign in"}
                            </Text>
                        </Pressable>
                    </>
                )}
            </View>
        </AuthScreen>
    );
};

export default SignIn;
