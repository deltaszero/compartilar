"use client";

import { Badge } from "@/components/ui/badge";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { Sparkles } from "lucide-react";

interface UserProfileProps {
    userData: {
        uid: string;
        firstName?: string;
        lastName?: string;
        username: string;
        photoURL?: string;
        email: string;
        displayName?: string;
    };
}

const capitalizeFirstLetter = (string: string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const UserProfileCard = ({ userData }: UserProfileProps) => {
    const { isPremium } = usePremiumFeatures();
    const displayName = userData?.firstName ||
        userData?.displayName ||
        userData?.username || "";

    return (
        <div className="flex justify-between items-start p-4">
            <div className="flex flex-col items-start gap-2">
                <div className="text-5xl font-black font-raleway">
                    Olá,
                    <br />
                    {capitalizeFirstLetter(displayName)}!
                </div>
                <div className="flex items-center gap-2">
                    <Badge className='flex flex-row items-center gap-1 rounded-xl bg-blank text-bw text-sm font-nunito' variant="default">
                        @{userData?.username || ""}
                    </Badge>
                    {isPremium && (
                        <Badge className="flex flex-row items-center gap-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-nunito">
                            <Sparkles className="h-3.5 w-3.5" />
                            Premium
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;