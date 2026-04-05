import { Text, View } from "react-native";
import { clsx } from "clsx";

type AuthNoticeProps = {
    message?: string | null;
    tone?: "error" | "info";
};

const AuthNotice = ({ message, tone = "info" }: AuthNoticeProps) => {
    if (!message) {
        return null;
    }

    return (
        <View className={clsx("auth-banner", tone === "error" ? "auth-banner-error" : "auth-banner-info")}>
            <Text className="auth-banner-text">{message}</Text>
        </View>
    );
};

export default AuthNotice;
