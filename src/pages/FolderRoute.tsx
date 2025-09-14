import { useParams } from 'react-router-dom';
import FolderPage from './FolderPage';

export function FolderRoute() {
  const { folderId } = useParams<{ folderId: string }>();
  console.log("FolderRoute params: ", folderId);
  if (!folderId) return <div>Invalid folder</div>;
  return <FolderPage folderId={folderId} />;
}