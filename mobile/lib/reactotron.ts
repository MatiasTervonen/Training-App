import Reactotron from "reactotron-react-native";
import {
  QueryClientManager,
  reactotronReactQuery,
} from "reactotron-react-query";
import { appQueryClient } from "./reactQueryClient";

const queryClientManager = new QueryClientManager({
  queryClient: appQueryClient,
});

Reactotron.configure({
  onDisconnect: () => {
    queryClientManager.unsubscribe();
  },
})
  .use(reactotronReactQuery(queryClientManager))
  .useReactNative()
  .connect();
