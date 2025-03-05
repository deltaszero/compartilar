'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { KidInfo } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const ChildCard = ({ child }: { child: KidInfo }) => {
    const getAgeText = (birthDateStr: string) => {
        try {
            const birthDate = new Date(birthDateStr);
            const today = new Date();
            
            let years = today.getFullYear() - birthDate.getFullYear();
            const months = today.getMonth() - birthDate.getMonth();
            
            if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
                years--;
            }
            
            if (years < 1) {
                // Calculate months for babies
                const monthAge = months + (months < 0 ? 12 : 0);
                return `${monthAge} ${monthAge === 1 ? 'mês' : 'meses'}`;
            }
            
            return `${years} ${years === 1 ? 'ano' : 'anos'}`;
        } catch (e) {
            return "Idade não disponível";
        }
    };

    const getRelationshipText = (relationship: string | null) => {
        if (!relationship) return "Relação não especificada";
        
        switch (relationship) {
            case "biological": return "Filho(a) Biológico(a)";
            case "adopted": return "Filho(a) Adotivo(a)";
            case "guardian": return "Sob Guarda";
            default: return "Relação não especificada";
        }
    };

    const getGenderText = (gender: string | null) => {
        if (!gender) return "";
        
        switch (gender) {
            case "male": return "Menino";
            case "female": return "Menina";
            case "other": return "";
            default: return "";
        }
    };

    return (
        <Card className="overflow-hidden bg-card shadow-md rounded-xl border-2 border-border hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row">
                <div className="relative sm:w-32 h-32 sm:h-auto bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-border">
                    {child.photoURL ? (
                        <Image
                            src={child.photoURL}
                            alt={`${child.firstName}'s photo`}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary/70">
                                {child.firstName[0].toUpperCase()}
                                {child.lastName[0].toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col p-4 flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold">{child.firstName} {child.lastName}</h3>
                            <p className="text-sm text-muted-foreground">{getAgeText(child.birthDate)}</p>
                        </div>
                        {child.gender && (
                            <Badge variant="default" className="ml-auto">
                                {getGenderText(child.gender)}
                            </Badge>
                        )}
                    </div>
                    
                    <div className="mt-auto pt-2">
                        <p className="text-xs text-muted-foreground border-t border-border pt-2">
                            {getRelationshipText(child.relationship)}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export const NoChildrenMessage = () => (
    <div className="text-center p-6 bg-muted/30 rounded-xl border border-border">
        <h3 className="text-lg font-medium mb-2">Nenhuma criança cadastrada</h3>
        <p className="text-muted-foreground">
            Não há crianças vinculadas a este perfil.
        </p>
    </div>
);

export const ChildrenGrid = ({ userId, isOwnProfile }: { userId: string, isOwnProfile: boolean }) => {
    const [children, setChildren] = useState<KidInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChildren = async () => {
            if (!userId) return;
            
            try {
                const q = query(
                    collection(db, "children"),
                    where("parentId", "==", userId)
                );
                const snapshot = await getDocs(q);
                const childrenData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        birthDate: data.birthDate,
                        gender: data.gender,
                        relationship: data.relationship,
                        photoURL: data.photoURL || null,
                    };
                });
                
                setChildren(childrenData);
            } catch (error) {
                console.error("Error fetching children:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChildren();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <Card className="rounded-xl border-2 border-border shadow-md bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="text-xl font-semibold">Crianças</h3>
                {isOwnProfile && (
                    <Button variant="default" size="sm" className="rounded-full">
                        <span className="mr-1">+</span> Adicionar
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {children.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {children.map((child) => (
                            <ChildCard key={child.id} child={child} />
                        ))}
                    </div>
                ) : (
                    <NoChildrenMessage />
                )}
            </CardContent>
            {children.length > 0 && isOwnProfile && (
                <CardFooter className="flex justify-center border-t border-border pt-4">
                    <Button variant="default" className="rounded-full">
                        Gerenciar Crianças
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default ChildrenGrid;