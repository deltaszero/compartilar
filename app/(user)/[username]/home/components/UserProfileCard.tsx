"use client";

import { Badge } from "@/components/ui/badge";

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
                {/* <div className="text-md font-semibold font-nunito"> */}
                <Badge className='flex flex-row items-center gap-1 rounded-xl bg-blank text-bw text-sm font-nunito' variant="default" >
                    @{userData?.username || ""}
                </Badge>
                {/* </div> */}
            </div>
        </div>
    );
};

export default UserProfileCard;