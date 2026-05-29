import type { AdminContentDeletionResult } from './adminRepository';

type SupabaseLikeClient = {
  from(table: string): any;
};

type IdRow = { id: string };

export async function clearCollectionContentWithClient(client: SupabaseLikeClient, collectionId: string): Promise<AdminContentDeletionResult> {
  let listIds: string[];
  try {
    const { data, error } = await client.from('word_lists').select('id').eq('collection_id', collectionId);
    if (error) throw error;
    listIds = ((data ?? []) as IdRow[]).map(row => row.id);
  } catch (error) {
    throw new Error(`Could not find word lists for collection "${collectionId}": ${readErrorMessage(error)}`);
  }

  if (!listIds.length) return { listsDeleted: 0, wordsDeleted: 0 };

  let wordIds: string[];
  try {
    const { data, error } = await client.from('words').select('id').in('list_id', listIds);
    if (error) throw error;
    wordIds = ((data ?? []) as IdRow[]).map(row => row.id);
  } catch (error) {
    throw new Error(`Could not count words for collection "${collectionId}": ${readErrorMessage(error)}`);
  }

  try {
    const { error } = await client.from('words').delete().in('list_id', listIds);
    if (error) throw error;
  } catch (error) {
    throw new Error(`Could not delete words for collection "${collectionId}": ${readErrorMessage(error)}`);
  }

  try {
    const { error } = await client.from('word_lists').delete().eq('collection_id', collectionId);
    if (error) throw error;
  } catch (error) {
    throw new Error(`Could not delete word lists for collection "${collectionId}": ${readErrorMessage(error)}`);
  }

  return { listsDeleted: listIds.length, wordsDeleted: wordIds.length };
}

export async function deleteWordListWithClient(client: SupabaseLikeClient, listId: string): Promise<AdminContentDeletionResult> {
  let wordIds: string[];
  try {
    const { data, error } = await client.from('words').select('id').eq('list_id', listId);
    if (error) throw error;
    wordIds = ((data ?? []) as IdRow[]).map(row => row.id);
  } catch (error) {
    throw new Error(`Could not count words for list "${listId}": ${readErrorMessage(error)}`);
  }

  try {
    const { error } = await client.from('words').delete().eq('list_id', listId);
    if (error) throw error;
  } catch (error) {
    throw new Error(`Could not delete words for list "${listId}": ${readErrorMessage(error)}`);
  }

  try {
    const { error } = await client.from('word_lists').delete().eq('id', listId);
    if (error) throw error;
  } catch (error) {
    throw new Error(`Could not delete word list "${listId}": ${readErrorMessage(error)}`);
  }

  return { listsDeleted: 1, wordsDeleted: wordIds.length };
}

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
