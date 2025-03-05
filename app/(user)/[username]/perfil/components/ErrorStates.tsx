'use client';
import { Button } from "@/components/ui/button";

export const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center h-[70vh]">
        <div className="text-center space-y-4 p-8 bg-muted/30 rounded-2xl border border-border shadow-sm">
            <p className="text-3xl font-bold text-destructive">
                Usuário não encontrado
            </p>
            <p className="text-muted-foreground">
                O perfil que você está procurando não existe ou não está disponível.
            </p>
        </div>
    </div>
);

export const AccessDenied = () => (
    <div className="flex flex-1 flex-col items-center justify-center h-[70vh]">
        <div className="text-center space-y-4 p-8 bg-muted/30 rounded-2xl border border-border shadow-sm max-w-md">
            <p className="text-3xl font-bold text-destructive">
                Acesso Negado
            </p>
            <p className="text-muted-foreground">
                Você precisa ser amigo ou familiar para visualizar este perfil.
            </p>
            <Button variant="default" className="mt-4">
                Voltar para Home
            </Button>
        </div>
    </div>
);

export default { UserNotFound, AccessDenied };