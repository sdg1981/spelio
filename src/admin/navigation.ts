export type AdminNavIconKey =
  | 'audio'
  | 'collections'
  | 'customLists'
  | 'dialects'
  | 'focusCategories'
  | 'helperAudio'
  | 'importExport'
  | 'overview'
  | 'settings'
  | 'stages'
  | 'wordLists'
  | 'words';

export type AdminNavItem = {
  label: string;
  path: string;
  icon: AdminNavIconKey;
  badge?: string;
  description: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Content',
    items: [
      {
        label: 'Overview',
        path: '/admin',
        icon: 'overview',
        description: 'Editorial dashboard for current Spelio content health.'
      },
      {
        label: 'Collections',
        path: '/admin/collections',
        icon: 'collections',
        description: 'Top-level Learning and Practice Library containers that affect public catalogue availability.'
      },
      {
        label: 'Word Lists',
        path: '/admin/word-lists',
        icon: 'wordLists',
        description: 'Learner-facing journey and Practice Library lists, including list order, public visibility, and metadata.'
      },
      {
        label: 'Words',
        path: '/admin/words',
        icon: 'words',
        description: 'Searchable editorial view of individual spelling items used inside word lists.'
      },
      {
        label: 'Custom Lists',
        path: '/admin/custom-lists',
        icon: 'customLists',
        badge: 'Preview',
        description: 'Temporary user-created share lists and their moderation/audio state.'
      }
    ]
  },
  {
    label: 'Audio',
    items: [
      {
        label: 'Audio Queue',
        path: '/admin/audio',
        icon: 'audio',
        description: 'Word-list audio generation and repair queue.'
      },
      {
        label: 'Helper Audio',
        path: '/admin/interface-audio',
        icon: 'helperAudio',
        description: 'Interface and coaching audio used outside normal word-list rows.'
      }
    ]
  },
  {
    label: 'Reference / Structure',
    items: [
      {
        label: 'Dialects',
        path: '/admin/dialects',
        icon: 'dialects',
        description: 'Reference labels used by word lists and words for dialect handling.'
      },
      {
        label: 'Internal Stages',
        path: '/admin/stages',
        icon: 'stages',
        badge: 'Internal',
        description: 'Read-only reference metadata used by progression, import/export, and some public catalogue grouping.'
      },
      {
        label: 'Internal Focus Categories',
        path: '/admin/focus-categories',
        icon: 'focusCategories',
        badge: 'Internal',
        description: 'Read-only editorial metadata used by word-list editing and import/export, not Practice Library category headings.'
      }
    ]
  },
  {
    label: 'System',
    items: [
      {
        label: 'Import / Export',
        path: '/admin/import',
        icon: 'importExport',
        description: 'Content backup, validation, and migration import workflow.'
      },
      {
        label: 'Settings',
        path: '/admin/settings',
        icon: 'settings',
        description: 'Founder settings and integration readiness.'
      }
    ]
  }
];
