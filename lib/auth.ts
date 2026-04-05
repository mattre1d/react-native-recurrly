import type { Href, Router } from "expo-router";
import * as Linking from "expo-linking";

type ClerkFieldErrorLike = {
    longMessage?: string | null;
    message?: string | null;
} | null | undefined;

type ClerkGlobalErrorLike = {
    longMessage?: string | null;
    message?: string | null;
} | null | undefined;

type SessionTaskLike = {
    key?: string | null;
} | null | undefined;

type AuthNavigateParams = {
    decorateUrl: (url: string) => string;
    session?: {
        currentTask?: SessionTaskLike;
    } | null;
};

export const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

export const validateVerificationCode = (value: string): boolean => {
    return /^\d{6}$/.test(value.trim());
};

export const getClerkFieldMessage = (error: ClerkFieldErrorLike): string | null => {
    return error?.longMessage?.trim() || error?.message?.trim() || null;
};

export const getClerkGlobalMessage = (errors: ClerkGlobalErrorLike[] | null | undefined): string | null => {
    if (!errors || errors.length === 0) {
        return null;
    }

    for (const error of errors) {
        const message = error?.longMessage?.trim() || error?.message?.trim();
        if (message) {
            return message;
        }
    }

    return null;
};

export const getClerkErrorMessage = (error: ClerkGlobalErrorLike): string | null => {
    return error?.longMessage?.trim() || error?.message?.trim() || null;
};

export const getUnsupportedAuthStateMessage = (status?: string | null): string => {
    switch (status) {
        case "needs_second_factor":
            return "Extra verification is required for this account. This version only supports email-code verification right now.";
        case "needs_new_password":
            return "This account needs a password reset before you can continue.";
        case "needs_identifier":
        case "needs_first_factor":
            return "We could not finish signing you in. Please try again.";
        default:
            return "We could not complete that step right now. Please try again in a moment.";
    }
};

export const getSessionTaskMessage = (task: SessionTaskLike): string => {
    switch (task?.key) {
        case "choose-organization":
            return "Your account needs one more setup step before you can continue.";
        case "complete-your-profile":
            return "Your account is almost ready. A final profile step is still required.";
        case "verify-email-address":
            return "Your email still needs to be verified before you can continue.";
        case "verify-phone-number":
            return "Your phone number still needs to be verified before you can continue.";
        default:
            return "Your account needs one more security step before the app can continue.";
    }
};

export const navigateAfterAuth = async ({
    router,
    params,
    onSessionTask,
}: {
    router: Router;
    params: AuthNavigateParams;
    onSessionTask: (message: string) => void;
}): Promise<void> => {
    if (params.session?.currentTask) {
        onSessionTask(getSessionTaskMessage(params.session.currentTask));
        return;
    }

    const url = params.decorateUrl("/");
    if (url.startsWith("http")) {
        await Linking.openURL(url);
        return;
    }

    router.replace(url as Href);
};
