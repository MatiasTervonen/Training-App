import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "../components/AppText";
import AppInput from "../components/AppInput";
import Screen from "../components/Screen";
import { useState } from "react";
import NotesInput from "../components/NotesInput";

export default function NotesScreen() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-col items-center">
          <View>
            <AppText className="text-2xl text-center my-5">
              Add your notes here
            </AppText>
            <AppInput label="Title.." placeholder="Notes title..." />
          </View>
          <View className="w-full px-5 mt-10">
            <NotesInput
              notes={notes}
              setNotes={setNotes}
              placeholder="Write your notes here..."
              label="Notes..."
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Screen>
  );
}
