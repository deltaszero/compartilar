'use client';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface InfoProps {
    email?: string;
    isEditing?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    about?: string;
}

export const ProfileInfoSection = ({ email, isEditing, onChange }: InfoProps) => (
    <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
            <h3 className="text-xl font-semibold">Informações Pessoais</h3>
        </CardHeader>
        <CardContent className="space-y-4">
            {isEditing ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="profileEmail">Email</Label>
                        <Input 
                            id="profileEmail" 
                            name="email"
                            type="email"
                            value={email || ''} 
                            onChange={onChange}
                        />
                    </div>
                </div>
            ) : (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground font-medium">Email</p>
                    <p className="font-medium">{email || 'Não informado'}</p>
                </div>
            )}
        </CardContent>
    </Card>
);

export const AboutSection = ({ about, isEditing, onChange }: InfoProps) => (
    <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
            <h3 className="text-xl font-semibold">Sobre</h3>
        </CardHeader>
        <CardContent>
            {isEditing ? (
                <div className="space-y-2">
                    <Label htmlFor="about">Informações sobre você</Label>
                    <Textarea 
                        id="about" 
                        name="about"
                        value={about || ''} 
                        onChange={onChange}
                        placeholder="Escreva uma breve descrição sobre você..."
                        className="min-h-24"
                    />
                </div>
            ) : (
                <p className="text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                    {about || 'Nenhuma informação disponível.'}
                </p>
            )}
        </CardContent>
    </Card>
);

export const ActivitiesSection = () => (
    <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
        <CardHeader>
            <h3 className="text-xl font-semibold">Atividades Recentes</h3>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground p-3 rounded-lg bg-muted/30 border border-border">
                Nenhuma atividade recente.
            </p>
        </CardContent>
    </Card>
);

export default { ProfileInfoSection, AboutSection, ActivitiesSection };