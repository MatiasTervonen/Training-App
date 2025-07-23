import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Reactotron.setAsyncStorageHandler(AsyncStorage) // controls connection & communication settings // set AsyncStorage handler
  .configure()
  .useReactNative()
  .connect(); // let's connect!

console.tron = Reactotron;
Reactotron.log("Reactotron connected!");
