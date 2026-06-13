export const ProfileAccess = Object.freeze({
  OWNER: Object.freeze({
    id: "owner",
    name: "Owner",
    icon: "pi-crown",
    description:
      "Full control over the profile: can edit settings, manage access, and delete the profile.",
  }),
  EDITOR: Object.freeze({
    id: "editor",
    name: "Editor",
    icon: "pi-pencil",
    description:
      "Can modify profile content and settings but cannot manage access or delete the profile.",
  }),
  VIEWER: Object.freeze({
    id: "viewer",
    name: "Viewer",
    icon: "pi-eye",
    description:
      "Read-only access to view profile content and settings without making changes.",
  }),
});

export const ProfileState = Object.freeze({
  INACTIVE: Object.freeze({
    id: "inactive",
    name: "Inactive",
    icon: "pi-spinner",
    description:
      "This profile is still being set up. The system needs to finish a few setup steps before you can start using it. Once everything’s ready, it will automatically become active.",
  }),
  ACTIVE: Object.freeze({
    id: "active",
    name: "Active",
    icon: "pi-check-circle",
    description:
      "This profile is fully ready to use. You can access all features and manage it like normal.",
  }),
  TEMPLATE: Object.freeze({
    id: "template",
    name: "Template",
    icon: "pi-star",
    description:
      "Think of this as a reusable starter profile. You can copy it to quickly create a new profile with your preferred settings already in place.",
  }),
  DISABLED: Object.freeze({
    id: "disabled",
    name: "Disabled",
    icon: "pi-lock",
    description:
      "This profile has been turned off for now. You can view it in read‑only mode, but it can’t be used until it’s re‑enabled.",
  }),
  DELETED: Object.freeze({
    id: "deleted",
    name: "Deleted",
    icon: "pi-trash",
    description:
      "This profile is scheduled for deletion. It will be permanently removed after 30 days, but you can still restore it anytime before that if you change your mind.",
  }),
});
