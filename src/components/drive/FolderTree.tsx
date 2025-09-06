import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { foldersApi } from '@/api/folders';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  currentFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderNodeProps {
  folderId?: string | null;
  level: number;
  currentFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

function FolderNode({ folderId, level, currentFolderId, onFolderSelect }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', folderId],
    queryFn: () => foldersApi.list(folderId || undefined),
    enabled: expanded || level === 0,
  });

  const hasChildren = folders.length > 0;

  return (
    <>
      {folders.map((folder) => {
        const isSelected = currentFolderId === folder.id;
        const isRoot = level === 0;

        return (
          <div key={folder.id}>
            <Button
              variant="ghost"
              onClick={() => onFolderSelect(folder.id)}
              className={cn(
                'w-full justify-start gap-2 h-8 text-sm',
                isSelected && 'bg-secondary',
                !isRoot && 'ml-4'
              )}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {hasChildren ? (
                  expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )
                ) : null}
              </Button>
              
              {isSelected ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
              <span className="truncate">{folder.name}</span>
            </Button>

            {expanded && hasChildren && (
              <FolderNode
                folderId={folder.id}
                level={level + 1}
                currentFolderId={currentFolderId}
                onFolderSelect={onFolderSelect}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function FolderTree({ currentFolderId, onFolderSelect }: FolderTreeProps) {
  return (
    <div className="space-y-1">
      <FolderNode
        folderId={null}
        level={0}
        currentFolderId={currentFolderId}
        onFolderSelect={onFolderSelect}
      />
    </div>
  );
}