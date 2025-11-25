import { mergeResolvers } from "@graphql-tools/merge";
import { boardResolver } from "./boardResolver";
import { taskResolver } from "./taskResolver";
import { columnResolver } from "./columnResolver";
import { authResolver } from "./authResolver";

export const resolvers = mergeResolvers([authResolver, boardResolver, taskResolver, columnResolver]);