import { clsx } from "clsx";
import { Pressable, Text, TextInput, type TextInputProps, View } from "react-native";

type AuthTextFieldProps = TextInputProps & {
    actionLabel?: string;
    error?: string | null;
    helper?: string | null;
    label: string;
    onActionPress?: () => void;
};

const AuthTextField = ({
    actionLabel,
    error,
    helper,
    label,
    onActionPress,
    ...props
}: AuthTextFieldProps) => {
    return (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>

            <View className="auth-input-wrap">
                <TextInput
                    {...props}
                    className={clsx(
                        "auth-input",
                        actionLabel && "auth-input-with-action",
                        error && "auth-input-error",
                        props.editable === false && "opacity-60",
                    )}
                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                />

                {actionLabel ? (
                    <Pressable className="auth-input-action" hitSlop={8} onPress={onActionPress}>
                        <Text className="auth-input-action-text">{actionLabel}</Text>
                    </Pressable>
                ) : null}
            </View>

            {error ? <Text className="auth-error">{error}</Text> : null}
            {!error && helper ? <Text className="auth-helper">{helper}</Text> : null}
        </View>
    );
};

export default AuthTextField;
