export interface QuestResponse {
  success: boolean;
  quests: QuestType[];
  errorCode: string;
}

export interface QuestType {
  name: string;
  isCompleted: boolean;
  type: string;
  questId: number;
  rewardVal: string;
  objective1Id: number;
  objective1Val: string;
  objective1Max: string;
}
