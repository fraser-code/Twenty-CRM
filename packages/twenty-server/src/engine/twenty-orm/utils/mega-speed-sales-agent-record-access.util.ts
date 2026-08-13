import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';
import {
  TwentyORMException,
  TwentyORMExceptionCode,
} from 'src/engine/twenty-orm/exceptions/twenty-orm.exception';

const SALES_AGENT_ROLE_LABEL = 'Sales Agent';
const SALES_AGENT_OWNER_COLUMN_BY_OBJECT_NAME: Record<string, string> = {
  note: 'ownerId',
  opportunity: 'ownerId',
  person: 'ownerId',
  task: 'assigneeId',
};

type MegaSpeedSalesAgentRecordAccessCondition = {
  sql: string;
  parameters: Record<string, unknown>;
};

export const shouldApplyMegaSpeedSalesAgentRecordAccess = ({
  authContext,
  internalContext,
}: {
  authContext: WorkspaceAuthContext;
  internalContext: WorkspaceInternalContext;
}): boolean => {
  if (!isUserAuthContext(authContext)) {
    return false;
  }

  const roleId =
    internalContext.userWorkspaceRoleMap[authContext.userWorkspaceId];

  if (!roleId) {
    return false;
  }

  const roleUniversalIdentifier =
    internalContext.flatRoleMaps.universalIdentifierById[roleId];

  if (!roleUniversalIdentifier) {
    return false;
  }

  const role = internalContext.flatRoleMaps.byUniversalIdentifier[
    roleUniversalIdentifier
  ];

  return role?.label === SALES_AGENT_ROLE_LABEL;
};

export const getMegaSpeedSalesAgentOwnerColumnName = ({
  objectMetadata,
}: {
  objectMetadata: FlatObjectMetadata;
}): string | null =>
  SALES_AGENT_OWNER_COLUMN_BY_OBJECT_NAME[objectMetadata.nameSingular] ?? null;

export const assertMegaSpeedSalesAgentObjectHasOwnerField = ({
  objectMetadata,
  ownerColumnName,
  internalContext,
}: {
  objectMetadata: FlatObjectMetadata;
  ownerColumnName: string;
  internalContext: WorkspaceInternalContext;
}): void => {
  const ownerFieldName = ownerColumnName.replace(/Id$/, '');
  const hasOwnerField = Object.values(
    internalContext.flatFieldMetadataMaps.byUniversalIdentifier,
  ).some(
    (fieldMetadata) =>
      fieldMetadata?.objectMetadataId === objectMetadata.id &&
      fieldMetadata.name === ownerFieldName,
  );

  if (!hasOwnerField) {
    throw new TwentyORMException(
      `Mega Speed Sales Agent access requires "${ownerColumnName}" on "${objectMetadata.nameSingular}" records.`,
      TwentyORMExceptionCode.MALFORMED_METADATA,
    );
  }
};

export const applyMegaSpeedSalesAgentRecordAccessWhere = <T extends {
  andWhere: (where: string, parameters?: Record<string, unknown>) => T;
}>({
  queryBuilder,
  objectMetadata,
  internalContext,
  authContext,
  useDirectTableReference = false,
}: {
  queryBuilder: T;
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  useDirectTableReference?: boolean;
}): void => {
  const renderedCondition = renderMegaSpeedSalesAgentRecordAccessCondition({
    objectMetadata,
    internalContext,
    authContext,
    useDirectTableReference,
  });

  if (!renderedCondition) {
    return;
  }

  queryBuilder.andWhere(renderedCondition.sql, renderedCondition.parameters);
};

export const renderMegaSpeedSalesAgentRecordAccessCondition = ({
  objectMetadata,
  internalContext,
  authContext,
  ownerColumnName,
  tableAlias,
  useDirectTableReference = false,
}: {
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  ownerColumnName?: string;
  tableAlias?: string;
  useDirectTableReference?: boolean;
}): MegaSpeedSalesAgentRecordAccessCondition | null => {
  if (
    !shouldApplyMegaSpeedSalesAgentRecordAccess({
      authContext,
      internalContext,
    })
  ) {
    return null;
  }

  const resolvedOwnerColumnName =
    ownerColumnName ??
    getMegaSpeedSalesAgentOwnerColumnName({
      objectMetadata,
    });

  if (!resolvedOwnerColumnName || !isUserAuthContext(authContext)) {
    return null;
  }

  assertMegaSpeedSalesAgentObjectHasOwnerField({
    objectMetadata,
    ownerColumnName: resolvedOwnerColumnName,
    internalContext,
  });

  const fieldReference = useDirectTableReference
    ? `"${resolvedOwnerColumnName}"`
    : `"${tableAlias ?? objectMetadata.nameSingular}"."${resolvedOwnerColumnName}"`;

  return {
    sql: `${fieldReference} = :megaSpeedWorkspaceMemberId`,
    parameters: {
      megaSpeedWorkspaceMemberId: authContext.workspaceMemberId,
    },
  };
};

export const setMegaSpeedSalesAgentOwnerOnInsertRecords = ({
  records,
  objectMetadata,
  internalContext,
  authContext,
  shouldBypassPermissionChecks,
}: {
  records: Record<string, unknown>[];
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  shouldBypassPermissionChecks: boolean;
}): void => {
  if (
    shouldBypassPermissionChecks ||
    !shouldApplyMegaSpeedSalesAgentRecordAccess({
      authContext,
      internalContext,
    }) ||
    !isUserAuthContext(authContext)
  ) {
    return;
  }

  const ownerColumnName = getMegaSpeedSalesAgentOwnerColumnName({
    objectMetadata,
  });

  if (!ownerColumnName) {
    return;
  }

  assertMegaSpeedSalesAgentObjectHasOwnerField({
    objectMetadata,
    ownerColumnName,
    internalContext,
  });

  for (const record of records) {
    if (
      record[ownerColumnName] === undefined ||
      record[ownerColumnName] === null
    ) {
      record[ownerColumnName] = authContext.workspaceMemberId;
    }
  }
};

export const validateMegaSpeedSalesAgentRecords = ({
  records,
  objectMetadata,
  internalContext,
  authContext,
  shouldBypassPermissionChecks,
}: {
  records: Record<string, unknown>[];
  objectMetadata: FlatObjectMetadata;
  internalContext: WorkspaceInternalContext;
  authContext: WorkspaceAuthContext;
  shouldBypassPermissionChecks: boolean;
}): void => {
  if (
    shouldBypassPermissionChecks ||
    !shouldApplyMegaSpeedSalesAgentRecordAccess({
      authContext,
      internalContext,
    }) ||
    !isUserAuthContext(authContext)
  ) {
    return;
  }

  const ownerColumnName = getMegaSpeedSalesAgentOwnerColumnName({
    objectMetadata,
  });

  if (!ownerColumnName) {
    return;
  }

  assertMegaSpeedSalesAgentObjectHasOwnerField({
    objectMetadata,
    ownerColumnName,
    internalContext,
  });

  const invalidRecord = records.find(
    (record) => record[ownerColumnName] !== authContext.workspaceMemberId,
  );

  if (invalidRecord) {
    throw new TwentyORMException(
      'Sales Agent records must be assigned to the current workspace member.',
      TwentyORMExceptionCode.RLS_VALIDATION_FAILED,
    );
  }
};
