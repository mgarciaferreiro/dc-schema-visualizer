export interface SchemaNode {
  name: string;
  children: SchemaNode[];
  isFetched: boolean;
  hasChildren: boolean;
}
