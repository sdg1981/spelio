import { AdminLayout } from './components/AdminLayout';
import { useAdminPath } from './utils/router';
import { AudioQueuePage } from './pages/AudioQueuePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { FocusCategoriesPage, DialectsPage, StagesPage } from './pages/StructurePages';
import { ImportPage } from './pages/ImportPage';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { WordListEditPage } from './pages/WordListEditPage';
import { WordListsPage } from './pages/WordListsPage';
import { WordsPage } from './pages/WordsPage';
import { getAdminRepository, type AdminRepository } from './repositories';

export function AdminApp() {
  const { path, navigate } = useAdminPath();
  const repository = getAdminRepository();

  if (path === '/admin/login') return <LoginPage navigate={navigate} repository={repository} />;

  return (
    <AdminLayout path={path} navigate={navigate}>
      <AdminRoute path={path} navigate={navigate} repository={repository} />
    </AdminLayout>
  );
}

function AdminRoute({ path, navigate, repository }: { path: string; navigate: (path: string) => void; repository: AdminRepository }) {
  if (path === '/admin') return <OverviewPage navigate={navigate} repository={repository} />;
  if (path === '/admin/word-lists') return <WordListsPage navigate={navigate} repository={repository} />;
  if (path === '/admin/collections') return <CollectionsPage repository={repository} />;
  if (path.startsWith('/admin/word-lists/')) return <WordListEditPage id={decodeURIComponent(path.replace('/admin/word-lists/', ''))} navigate={navigate} repository={repository} />;
  if (path === '/admin/words') return <WordsPage navigate={navigate} repository={repository} />;
  if (path === '/admin/audio') return <AudioQueuePage repository={repository} />;
  if (path === '/admin/import') return <ImportPage repository={repository} />;
  if (path === '/admin/stages') return <StagesPage repository={repository} />;
  if (path === '/admin/focus-categories') return <FocusCategoriesPage repository={repository} />;
  if (path === '/admin/dialects') return <DialectsPage repository={repository} />;
  if (path === '/admin/settings') return <SettingsPage />;

  return <OverviewPage navigate={navigate} repository={repository} />;
}
