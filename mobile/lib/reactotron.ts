import Reactotron from "reactotron-react-native";
import {
  QueryClientManager,
  reactotronReactQuery,
} from "reactotron-react-query";
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

const queryClientManager = new QueryClientManager({
  queryClient,
});

Reactotron.configure({
  onDisconnect: () => {
    queryClientManager.unsubscribe();
  },
})
  .use(reactotronReactQuery(queryClientManager))
  .useReactNative()
  .connect();
