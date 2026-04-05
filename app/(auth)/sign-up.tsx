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
import { useSignUp } from "@clerk/expo";
import type { SignUpSignalValue } from "@clerk/expo/types";
import { useRouter } from "expo-router";
import React from "react";
import { clsx } from "clsx";
import { Pressable, Text, View } from "react-native";

type SignUpHookState = {
    errors: SignUpSignalValue["errors"];
    fetchStatus: SignUpSignalValue["fetchStatus"];
    signUp: SignUpSignalValue["signUp"] | null;
};

type NoticeState = {
    message: string;
    tone: "error" | "info";
} | null;

type LocalErrors = {
    code?: string;
    emailAddress?: string;
    password?: string;
};

const SignUp = () => {
    const router = useRouter();
    const { errors, fetchStatus, signUp } = useSignUp() as unknown as SignUpHookState;

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [code, setCode] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [localErrors, setLocalErrors] = React.useState<LocalErrors>({});
    const [notice, setNotice] = React.useState<NoticeState>(null);

    if (!signUp) {
        return null;
    }

    const isSubmitting = fetchStatus === "fetching";
    const isVerificationStep = signUp.status === "missing_requirements"
        && signUp.unverifiedFields.includes("email_address")
        && signUp.missingFields.length === 0;

    const globalMessage = notice?.message || getClerkGlobalMessage(errors.global);
    const globalTone = notice?.tone || "error";

    const emailError = localErrors.emailAddress || getClerkFieldMessage(errors.fields.emailAddress);
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

    const finalizeSignUp = async () => {
        const { error } = await signUp.finalize({
            navigate: (params) => navigateAfterAuth({
                router,
                params,
                onSessionTask: (message) => setNotice({ message, tone: "error" }),
            }),
        });

        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "We could not finish setting up your account.",
                tone: "error",
            });
        }
    };

    const handleSubmit = async () => {
        const nextErrors: LocalErrors = {};
        const normalizedEmail = emailAddress.trim().toLowerCase();

        clearNotice();

        if (!normalizedEmail) {
            nextErrors.emailAddress = "Enter your email address.";
        } else if (!validateEmail(normalizedEmail)) {
            nextErrors.emailAddress = "Enter a valid email address.";
        }

        if (!password) {
            nextErrors.password = "Create a password to secure your account.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setLocalErrors(nextErrors);
            return;
        }

        setLocalErrors({});

        const { error } = await signUp.password({
            emailAddress: normalizedEmail,
            password,
        });

        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "We could not start your account setup.",
                tone: "error",
            });
            return;
        }

        const { error: verificationError } = await signUp.verifications.sendEmailCode();
        if (verificationError) {
            setNotice({
                message: getClerkErrorMessage(verificationError) || "We could not send your verification code.",
                tone: "error",
            });
            return;
        }

        setCode("");
        setNotice({
            message: "We sent a 6-digit code to your email so you can finish creating your account.",
            tone: "info",
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

        const { error } = await signUp.verifications.verifyEmailCode({ code: normalizedCode });
        if (error) {
            setNotice({
                message: getClerkErrorMessage(error) || "That code could not be verified. Please try again.",
                tone: "error",
            });
            return;
        }

        if (signUp.status === "complete") {
            await finalizeSignUp();
            return;
        }

        setNotice({
            message: getUnsupportedAuthStateMessage(signUp.status),
            tone: "error",
        });
    };

    const handleResendCode = async () => {
        clearNotice();

        const { error } = await signUp.verifications.sendEmailCode();
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
        await signUp.reset();
        setCode("");
        setLocalErrors({});
        setNotice(null);
    };

    return (
        <AuthScreen
            footerCopy="Already have an account?"
            footerHref="/sign-in"
            footerLinkLabel="Sign in"
            subtitle={isVerificationStep
                ? "Secure your new account with a quick email check."
                : "Start tracking recurring bills with one secure Recurly account."}
            title={isVerificationStep ? "Check your inbox" : "Create your account"}
        >
            <View className="auth-form">
                <AuthNotice message={globalMessage} tone={globalTone} />

                {isVerificationStep ? (
                    <>
                        <Text className="auth-verify-copy">
                            Enter the 6-digit code we sent to {emailAddress.trim().toLowerCase()} to activate your account.
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
                                {isSubmitting ? "Verifying..." : "Create account"}
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
                            error={emailError}
                            keyboardType="email-address"
                            label="Email"
                            onChangeText={(value) => {
                                setEmailAddress(value);
                                clearFieldError("emailAddress");
                                clearNotice();
                            }}
                            placeholder="Enter your email"
                            returnKeyType="next"
                            value={emailAddress}
                        />

                        <AuthTextField
                            actionLabel={showPassword ? "Hide" : "Show"}
                            autoCapitalize="none"
                            autoComplete="new-password"
                            error={passwordError}
                            helper={!passwordError ? "Use a strong password you do not reuse elsewhere." : null}
                            label="Password"
                            onActionPress={() => setShowPassword((current) => !current)}
                            onChangeText={(value) => {
                                setPassword(value);
                                clearFieldError("password");
                                clearNotice();
                            }}
                            placeholder="Create your password"
                            returnKeyType="done"
                            secureTextEntry={!showPassword}
                            textContentType="newPassword"
                            value={password}
                        />

                        <Pressable
                            className={clsx(
                                "auth-button",
                                (!emailAddress.trim() || !password || isSubmitting) && "auth-button-disabled",
                            )}
                            disabled={!emailAddress.trim() || !password || isSubmitting}
                            onPress={handleSubmit}
                        >
                            <Text className="auth-button-text">
                                {isSubmitting ? "Creating..." : "Continue"}
                            </Text>
                        </Pressable>
                    </>
                )}
            </View>

            <View nativeID="clerk-captcha" />
        </AuthScreen>
    );
};

export default SignUp;
