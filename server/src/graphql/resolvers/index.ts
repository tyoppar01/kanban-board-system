import { mergeResolvers } from "@graphql-tools/merge";
import { boardResolver } from "./boardResolver";
import { taskResolver } from "./taskResolver";
import { columnResolver } from "./columnResolver";

export const resolvers = mergeResolvers([boardResolver, taskResolver, columnResolver]);