import { type AllStandardObjectName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-name.type';
import { type AllStandardObjectViewName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-view-name.type';
import { type AllStandardObjectView } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-view.type';

type MegaSpeedStandardObjectViewFieldName<
  T extends AllStandardObjectName,
  V extends AllStandardObjectViewName<T>,
> = T extends 'note'
  ? V extends 'allNotes' | 'noteRecordPageFields'
    ? 'owner'
    : never
  : never;

export type AllStandardObjectViewFieldName<
  T extends AllStandardObjectName,
  V extends AllStandardObjectViewName<T>,
> = AllStandardObjectView<T>[V] extends { viewFields: infer ViewFields }
  ? keyof ViewFields | MegaSpeedStandardObjectViewFieldName<T, V>
  : never;
