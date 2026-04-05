import { Link, type Href } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type AuthScreenProps = {
    children: React.ReactNode;
    footerCopy: string;
    footerHref: Href;
    footerLinkLabel: string;
    subtitle: string;
    title: string;
};

const AuthScreen = ({
    children,
    footerCopy,
    footerHref,
    footerLinkLabel,
    subtitle,
    title,
}: AuthScreenProps) => {
    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="auth-screen">
                <ScrollView
                    className="auth-scroll"
                    contentContainerClassName="auth-content"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap pb-3">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">R</Text>
                            </View>

                            <View>
                                <Text className="auth-wordmark mb-1.5">Recurrly</Text>
                                <Text className="auth-wordmark-sub">Subscriptions</Text>
                            </View>
                        </View>

                        <Text className="auth-title">{title}</Text>
                        <Text className="auth-subtitle">{subtitle}</Text>
                    </View>

                    <View className="auth-card">
                        {children}

                        <View className="auth-link-row">
                            <Text className="auth-link-copy">{footerCopy}</Text>
                            <Link href={footerHref}>
                                <Text className="auth-link">{footerLinkLabel}</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AuthScreen;
