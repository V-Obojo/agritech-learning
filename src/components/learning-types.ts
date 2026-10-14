import type { Catalog, TopicConfig } from "@/lib/content/schemas";
export type LearningContext = {
  subjectId: string; topicId: string; basePath: string; hubPath: string; hubTitle: string;
  homePath: string; config: TopicConfig; intentions: Catalog["intentions"];
  nextTopic: { title: string; basePath: string } | null;
};
