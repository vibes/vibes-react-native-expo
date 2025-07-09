import { ConfigPlugin } from "expo/config-plugins";
import withIosPlugin from "./withIosPlugin";
import type { ConfigPluginProps } from "./types";
import withAndroidPlugin from "./withAndroidPlugin";

const index: ConfigPlugin<ConfigPluginProps> = (config, props) => {
  config = withAndroidPlugin(config, props);
  return withIosPlugin(config, props);
};

export default index;
