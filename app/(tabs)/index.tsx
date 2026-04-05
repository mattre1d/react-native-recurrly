import "@/global.css"
import { useUser } from "@clerk/expo";
import {FlatList, Image, Text, View} from "react-native";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from "@/constants/images";
import {HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import React from "react";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const { user } = useUser();
    const [expandedSubscriptionId, setExpandedSubscriptionId] = React.useState<string | null>(null);
    const displayName = user?.fullName?.trim()
        || user?.firstName?.trim()
        || user?.username?.trim()
        || user?.primaryEmailAddress?.emailAddress
        || "Recurly member";
    const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar;

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source={avatarSource} className="home-avatar" />
                                    <Text className="home-user-name" numberOfLines={1} ellipsizeMode="tail">
                                        {displayName}
                                    </Text>
                                </View>
                                <View className="home-add-icon">
                                    <Image source={icons.add} className="size-5" />
                                </View>
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label">Balance</Text>

                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">
                                        {formatCurrency(HOME_BALANCE.amount)}
                                    </Text>
                                    <Text className="home-balance-date">
                                        {dayjs(HOME_BALANCE.nextRenewalDate).format('DD/MM')}
                                    </Text>
                                </View>
                            </View>

                            <View>
                                <ListHeading title="Upcoming" />

                                <FlatList
                                    data={UPCOMING_SUBSCRIPTIONS}
                                    renderItem={({ item }) => (
                                        <UpcomingSubscriptionCard { ... item} />
                                    )}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals.</Text> }
                                />
                            </View>

                            <View className="mb-5"></View>

                            <ListHeading title="All Subscriptions" />
                        </>
                    )}
                    data={HOME_SUBSCRIPTIONS}
                    keyExtractor={(item) => item.id}
                    renderItem={ ({ item }) => (<SubscriptionCard
                        { ... item }
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => setExpandedSubscriptionId((currentId) =>
                            (currentId === item.id ? null : item.id)
                        )}
                    />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={() => <View className="h-4" />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
                    contentContainerClassName="pb-30"
                />
        </SafeAreaView>
    );
}
