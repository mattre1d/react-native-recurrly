import "@/global.css";
import SubscriptionCard from "@/components/SubscriptionCard";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { useFocusEffect } from "expo-router";
import React from "react";
import { clsx } from "clsx";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const deferredSearchQuery = React.useDeferredValue(searchQuery);
    const [expandedSubscriptionId, setExpandedSubscriptionId] = React.useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            return () => {
                setSearchQuery("");
                setExpandedSubscriptionId(null);
            };
        }, []),
    );

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const filteredSubscriptions = React.useMemo(() => {
        if (!normalizedQuery) {
            return HOME_SUBSCRIPTIONS;
        }

        return HOME_SUBSCRIPTIONS.filter((subscription) => {
            const searchableFields = [
                subscription.name,
                subscription.plan,
                subscription.category,
                subscription.paymentMethod,
                subscription.status,
                subscription.billing,
            ];

            return searchableFields.some((field) => field?.toLowerCase().includes(normalizedQuery));
        });
    }, [normalizedQuery]);

    React.useEffect(() => {
        if (!expandedSubscriptionId) {
            return;
        }

        const stillVisible = filteredSubscriptions.some((subscription) => subscription.id === expandedSubscriptionId);
        if (!stillVisible) {
            setExpandedSubscriptionId(null);
        }
    }, [expandedSubscriptionId, filteredSubscriptions]);

    const resultsLabel = normalizedQuery
        ? `${filteredSubscriptions.length} match${filteredSubscriptions.length === 1 ? "" : "es"} for "${deferredSearchQuery.trim()}"`
        : `${HOME_SUBSCRIPTIONS.length} subscriptions`;

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <FlatList
                contentContainerClassName="pb-30"
                data={filteredSubscriptions}
                ItemSeparatorComponent={() => <View className="h-4" />}
                keyboardDismissMode="on-drag"
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    <Text className="subscriptions-empty">
                        No subscriptions match that search yet. Try a service name, billing cycle, or category.
                    </Text>
                }
                ListHeaderComponent={(
                    <View className="mb-5">
                        <View className="subscriptions-header">
                            <Text className="subscriptions-title">Subscriptions</Text>
                            <Text className="subscriptions-subtitle">
                                Search across your current services and expand a card to review payment details.
                            </Text>
                        </View>

                        <View className="subscriptions-search-wrap">
                            <View className="subscriptions-search-input-wrap">
                                <TextInput
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className={clsx(
                                        "subscriptions-search-input",
                                        searchQuery.trim() && "subscriptions-search-input-has-clear",
                                    )}
                                    onChangeText={setSearchQuery}
                                    placeholder="Search by service, category, plan, or billing"
                                    placeholderTextColor="rgba(0, 0, 0, 0.45)"
                                    returnKeyType="search"
                                    value={searchQuery}
                                />

                                {searchQuery.trim() ? (
                                    <Pressable
                                        className="subscriptions-search-clear"
                                        hitSlop={8}
                                        onPress={() => setSearchQuery("")}
                                    >
                                        <Text className="subscriptions-search-clear-text">Clear</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            <Text className="subscriptions-search-meta">{resultsLabel}</Text>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => setExpandedSubscriptionId((currentId) => (
                            currentId === item.id ? null : item.id
                        ))}
                    />
                )}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

export default Subscriptions;
