import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChildHeaderSectionProps {
  username: string;
  childName: string;
}

export function ChildHeaderSection({ username, childName }: ChildHeaderSectionProps) {
  return (
    <div className="flex flex-col space-y-2 mb-6">
      <div className="flex items-center">
        <Link href={`/${username}/criancas`}>
          <Button variant="ghost" className="p-0 mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {childName || 'Carregando...'}
        </h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Gerencie as informações e permissões para {childName || 'esta criança'}
      </p>
    </div>
  );
}