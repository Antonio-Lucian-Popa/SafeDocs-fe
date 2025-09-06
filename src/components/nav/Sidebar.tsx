import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Folder, Clock, FileText, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FolderTree } from '../drive/FolderTree';
import { CreateFolderDialog } from '../drive/CreateFolderDialog';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  const currentFolderId = searchParams.get('folderId');

  const navItems = [
    {
      label: 'My Documents',
      icon: FileText,
      path: '/',
      active: !searchParams.get('search') && location.pathname === '/',
    },
    {
      label: 'Expiring Soon',
      icon: Clock,
      path: '/expiring-soon',
      active: location.pathname === '/expiring-soon',
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">SafeDocs</h2>
         
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={item.active ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2 h-10',
                item.active && 'bg-secondary'
              )}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="flex-1 justify-start gap-2 h-8 p-2 text-sm font-medium"
            >
              {foldersExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4" />
              Folders
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCreateFolderOpen(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {foldersExpanded && (
            <div className="ml-2">
              <FolderTree 
                currentFolderId={currentFolderId}
                onFolderSelect={(folderId) => {
                  if (folderId) {
                    navigate(`/?folderId=${folderId}`);
                  } else {
                    navigate('/');
                  }
                  onClose();
                }}
              />
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground px-2">Popular Tags</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Documents
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Contracts
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              Reports
            </Badge>
          </div>
        </div>
      </ScrollArea>

      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed left-0 top-16 bottom-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}