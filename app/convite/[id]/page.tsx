"use client";

import { useState, useEffect } from "react";
// import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
// import { useRouter } from "next/navigation";

type InvitationStatus = "loading" | "active" | "expired" | "not-found";

interface InvitationData {
    inviterId: string;
    inviterName: string;
    inviterUsername: string;
    invitationType: string;
    message: string;
    createdAt: Date | Timestamp;
    expiresAt: Date | Timestamp;
    status: "active" | "used" | "expired";
}

export default function InvitationPage({ params }: { params: { id: string } }) {
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [status, setStatus] = useState<InvitationStatus>("loading");
    // const router = useRouter();

    useEffect(() => {
        const fetchInvitation = async () => {
            try {
                // Fetch invitation data from Firestore
                const invitationDoc = await getDoc(doc(db, "invitations", params.id));

                if (!invitationDoc.exists()) {
                    setStatus("not-found");
                    return;
                }

                const invitationData = invitationDoc.data() as InvitationData;

                // Convert Firestore timestamps to Date objects
                const createdAt =
                    invitationData.createdAt instanceof Date
                        ? invitationData.createdAt
                        : new Date(invitationData.createdAt.seconds * 1000);

                const expiresAt =
                    invitationData.expiresAt instanceof Date
                        ? invitationData.expiresAt
                        : new Date(invitationData.expiresAt.seconds * 1000);

                // Check if invitation is expired
                const now = new Date();
                const isExpired = expiresAt < now;

                if (isExpired || invitationData.status === "expired") {
                    setStatus("expired");
                } else {
                    setStatus("active");
                    setInvitation({
                        ...invitationData,
                        createdAt,
                        expiresAt,
                    });
                }
            } catch (error) {
                console.error("Error fetching invitation:", error);
                setStatus("not-found");
            }
        };

        fetchInvitation();
    }, [params.id]);

    const renderInvitationCard = () => {
        if (!invitation) return null;

        const getRelationshipLabel = (type: string) => {
            switch (type) {
                case "coparent":
                    return "co-parentalidade";
                case "support":
                    return "rede de apoio";
                case "family":
                    return "família";
                case "friend":
                    return "amizade";
                default:
                    return "conexão";
            }
        };

        const relationshipLabel = getRelationshipLabel(invitation.invitationType);

        return (
            <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                        Convite para o CompartiLar
                    </h2>
                    <p className="text-sm text-gray-600">
                        {invitation.inviterName} convidou você para uma conexão de{" "}
                        {relationshipLabel}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <p className="italic text-gray-700">
                        &ldquo;{invitation.message}&rdquo;
                    </p>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Sobre o CompartiLar</h3>
                    <p className="text-sm text-gray-700">
                        CompartiLar é uma plataforma que ajuda famílias a gerenciar a
                        co-parentalidade e manter uma rede de apoio conectada.
                    </p>
                </div>

                <div className="flex flex-col space-y-3">
                    <Link href="/signup" className="btn btn-primary w-full">
                        Criar conta e aceitar convite
                    </Link>
                    <Link href="/login" className="btn btn-outline w-full">
                        Já tenho uma conta
                    </Link>
                </div>
            </div>
        );
    };

    const renderErrorContent = () => {
        if (status === "not-found") {
            return (
                <div className="text-center">
                    <div className="mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-red-500 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Convite não encontrado</h2>
                    <p className="text-gray-600 mb-6">
                        O convite que você está procurando não existe ou foi removido.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Ir para a página inicial
                    </Link>
                </div>
            );
        } else if (status === "expired") {
            return (
                <div className="text-center">
                    <div className="mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-amber-500 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Convite expirado</h2>
                    <p className="text-gray-600 mb-6">
                        Este convite expirou ou já foi utilizado.
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Ir para a página inicial
                    </Link>
                </div>
            );
        }

        return null;
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-purple-50 to-blue-50">
            <div className="w-full max-w-md">
                {status === "loading" ? (
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                        <p>Carregando convite...</p>
                    </div>
                ) : status === "active" ? (
                    renderInvitationCard()
                ) : (
                    renderErrorContent()
                )}
            </div>
        </main>
    );
}
