'use strict';

function documentVisibilityFilter(user) {
  return {
    organizationId: user.organizationId,
    deletedAt: null,
    OR: [
      { isPrivate: false },
      { createdById: user.id },
      { documentInvites: { some: { invitedUserId: user.id } } },
    ],
  };
}

function folderVisibilityFilter(user) {
  return {
    organizationId: user.organizationId,
    deletedAt: null,
    OR: [
      { isPrivate: false },
      { createdById: user.id },
      { folderInvites: { some: { invitedUserId: user.id } } },
    ],
  };
}

function ownedDocumentFilter(user) {
  return {
    organizationId: user.organizationId,
    createdById: user.id,
    deletedAt: null,
  };
}

function sharedWithMeDocumentFilter(user) {
  return {
    organizationId: user.organizationId,
    deletedAt: null,
    documentInvites: { some: { invitedUserId: user.id } },
  };
}

function sharedWithMeFolderFilter(user) {
  return {
    organizationId: user.organizationId,
    deletedAt: null,
    folderInvites: { some: { invitedUserId: user.id } },
  };
}

module.exports = {
  documentVisibilityFilter,
  folderVisibilityFilter,
  ownedDocumentFilter,
  sharedWithMeDocumentFilter,
  sharedWithMeFolderFilter,
};
