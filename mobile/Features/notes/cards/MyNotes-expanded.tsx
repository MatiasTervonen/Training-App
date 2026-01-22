import { formatDate } from "@/lib/formatDate";
import { View, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import CopyText from "@/components/CopyToClipboard";
import PageContainer from "@/components/PageContainer";
import { notes } from "@/types/models";



export default function MyNotesExpanded(item: notes) {

    return (
        <ScrollView>
            <PageContainer className="mb-10">
                <AppText className="text-sm text-gray-300 text-center">
                    created: {formatDate(item.created_at!)}
                </AppText>
                {item.updated_at && (
                    <AppText className="text-sm text-yellow-500 mt-2 text-center">
                        updated: {formatDate(item.updated_at)}
                    </AppText>
                )}
                <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
                    <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
                        {item.title}
                    </AppText>
                    <AppText className="text-lg text-left">{item.notes}</AppText>
                </View>
                <View className="mt-10">
                    <CopyText textToCopy={item.title + "\n\n" + item.notes} />
                </View>
            </PageContainer>
        </ScrollView>
    );
}
