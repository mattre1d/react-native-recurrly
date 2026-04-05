import { useAuth } from "@clerk/expo";
import { Redirect, Stack, usePathname } from "expo-router";

const SubscriptionLayout = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const pathname = usePathname();

    if (!isLoaded) {
        return null;
    }

    if (!isSignedIn) {
        return <Redirect href={{ pathname: "/sign-in", params: { returnTo: pathname } }} />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
};

export default SubscriptionLayout;
