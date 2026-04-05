import { useClerk, useUser } from "@clerk/expo";
import { clsx } from "clsx";
import React from "react";
import { Alert, Pressable, Text, View } from 'react-native'
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useClerk();
    const { user } = useUser();
    const [isSigningOut, setIsSigningOut] = React.useState(false);

    const handleSignOut = async () => {
        if (isSigningOut) {
            return;
        }

        try {
            setIsSigningOut(true);
            await signOut();
        } catch (error) {
            console.warn("Failed to sign out", error);
            Alert.alert(
                "Sign out unavailable",
                "We could not sign you out right now. Please try again in a moment.",
            );
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <View className="gap-6">
                <View className="gap-2">
                    <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
                    <Text className="text-base font-sans-medium leading-6 text-muted-foreground">
                        Manage your account access and keep your billing workspace secure.
                    </Text>
                </View>

                <View className="rounded-3xl border border-border bg-card p-5">
                    <Text className="text-sm font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
                        Account
                    </Text>
                    <Text className="mt-3 text-2xl font-sans-bold text-primary">
                        {user?.fullName?.trim() || "Recurly member"}
                    </Text>
                    <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress || "Signed in"}
                    </Text>

                    <Pressable
                        className={clsx("auth-button mt-6", isSigningOut && "auth-button-disabled")}
                        disabled={isSigningOut}
                        onPress={handleSignOut}
                    >
                        <Text className="auth-button-text">
                            {isSigningOut ? "Signing out..." : "Sign out"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    )
}
export default Settings
