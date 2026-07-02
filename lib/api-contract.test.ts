import type { Agent, KnowledgeBase, TencentCosSts, User } from "@/lib/api";

import { getTencentCosSts } from "@/lib/api";

function expectType<T>(_value: T) {}

expectType<KnowledgeBase[] | undefined>({} as User["knowledgeBases"]);
expectType<KnowledgeBase[] | undefined>({} as Agent["knowledgeBases"]);
expectType<Promise<TencentCosSts | undefined>>(getTencentCosSts());
