import type { AdminCollectionOwnerType, AdminCollectionType, AdminWordListCollection } from '../types';

const COLLECTION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCollectionSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createDraftAdminCollection(input: { existingCollections: AdminWordListCollection[]; now?: string }): AdminWordListCollection {
  const now = input.now ?? new Date().toISOString();
  const nextOrder = input.existingCollections.reduce((max, collection) => Math.max(max, collection.order), 0) + 1;

  return {
    id: '',
    slug: '',
    name: '',
    nameCy: '',
    description: '',
    descriptionCy: '',
    type: 'spelio_core',
    sourceLanguage: 'en',
    targetLanguage: 'cy',
    curriculumKeyStage: null,
    curriculumArea: null,
    ownerType: 'spelio',
    ownerId: null,
    order: nextOrder,
    isActive: true,
    introContent: null,
    createdAt: now,
    updatedAt: now
  };
}

export function validateAdminCollectionDraft(
  collection: Pick<AdminWordListCollection, 'id' | 'name' | 'slug' | 'type' | 'sourceLanguage' | 'targetLanguage' | 'order' | 'ownerType'>,
  existingCollections: Pick<AdminWordListCollection, 'id' | 'slug'>[]
) {
  const name = collection.name.trim();
  const slug = collection.slug.trim();
  const errors: string[] = [];

  if (!name) errors.push('Enter a collection name.');
  if (!slug) {
    errors.push('Enter a collection slug.');
  } else if (!COLLECTION_SLUG_PATTERN.test(slug)) {
    errors.push('Use lowercase letters, numbers, and hyphens only. Do not start or end with a hyphen.');
  }

  if (existingCollections.some(existing => existing.id !== collection.id && existing.slug === slug)) {
    errors.push('Choose a unique collection slug.');
  }

  if (!collection.type.trim()) errors.push('Choose a collection type.');
  if (!collection.sourceLanguage.trim()) errors.push('Enter a source language.');
  if (!collection.targetLanguage.trim()) errors.push('Enter a target language.');
  if (!Number.isFinite(collection.order) || collection.order < 0) errors.push('Enter a valid collection order.');
  if (collection.ownerType !== null && !isSupportedOwnerType(collection.ownerType)) errors.push('Choose a supported owner type.');

  return errors;
}

export function buildCollectionId(slug: string) {
  return slug.trim();
}

export const collectionTypeOptions: AdminCollectionType[] = ['spelio_core', 'curriculum', 'course', 'school', 'teacher', 'personal', 'custom'];
export const collectionOwnerTypeOptions: Exclude<AdminCollectionOwnerType, null>[] = ['spelio', 'school', 'teacher', 'user'];
export const collectionMetadataFieldLabels = [
  'Name',
  'Slug',
  'Description',
  'Type',
  'Source language',
  'Target language',
  'Order',
  'Public visibility',
  'Owner type',
  'Owner ID'
] as const;

function isSupportedOwnerType(value: AdminCollectionOwnerType): value is Exclude<AdminCollectionOwnerType, null> {
  return value === 'spelio' || value === 'school' || value === 'teacher' || value === 'user';
}
