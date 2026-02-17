export interface ColumnDef {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  pk?: boolean;
  fk?: string;
  check?: string;
  description: string;
}

export interface TableDef {
  name: string;
  description: string;
  authNote: string;
  columns: ColumnDef[];
  examples: { select: string; insert: string };
  responses: { getList: string; getOne: string; post: string };
}

export interface TableGroup {
  group: string;
  icon: React.ElementType;
  tables: TableDef[];
}

export interface ErrorCode {
  code: number;
  meaning: string;
  description: string;
}

export interface ChangelogEntry {
  date: string;
  type: 'new' | 'improved' | 'deprecated' | 'fixed';
  title: string;
  description: string;
}

export interface TocItem {
  id: string;
  label: string;
}

export interface TocGroup {
  title: string;
  icon: React.ElementType;
  items: TocItem[];
  defaultOpen?: boolean;
}
