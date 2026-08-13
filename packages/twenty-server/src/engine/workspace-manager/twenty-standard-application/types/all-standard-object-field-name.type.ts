import { type STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { type AllStandardObjectName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-name.type';

type MegaSpeedStandardObjectFieldName<T extends AllStandardObjectName> =
  T extends 'note'
    ? 'owner'
    : T extends 'person'
      ? 'owner'
      : T extends 'workspaceMember'
        ? 'ownedNotes' | 'ownedPeople'
        : never;

export type AllStandardObjectFieldName<T extends AllStandardObjectName> =
  | keyof (typeof STANDARD_OBJECTS)[T]['fields']
  | MegaSpeedStandardObjectFieldName<T>;
