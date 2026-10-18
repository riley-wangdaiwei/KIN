export interface TasteTag {
  id: string;
  label: string;
  x: number;
  y: number;
  groupIds: string[];
  createdAt: string;
}

export interface TasteProfile {
  tags: TasteTag[];
}
