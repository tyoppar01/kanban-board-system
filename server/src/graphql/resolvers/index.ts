import { mergeResolvers } from "@graphql-tools/merge";
import { boardResolver } from "./boardResolver";
import { taskResolver } from "./taskResolver";

export default mergeResolvers([boardResolver]);