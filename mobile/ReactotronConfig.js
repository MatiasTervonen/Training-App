import Reactotron, { asyncStorage } from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_NAME } from "./lib/app-config";

Reactotron.setAsyncStorageHandler(AsyncStorage) // controls connection & communication settings // set AsyncStorage handler
  .configure({
    name: APP_NAME,
  })
  .useReactNative()
  .use(asyncStorage())
  .connect(); // let's connect!
console.tron = Reactotron;
Reactotron.log("Reactotron connected!");
