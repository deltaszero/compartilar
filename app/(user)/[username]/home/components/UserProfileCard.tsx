"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getUserChildren } from "@/app/lib/firebaseConfig";

// Define interface for user data
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
  const [childStats, setChildStats] = useState({ total: 0, asEditor: 0, asViewer: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch children statistics
  useEffect(() => {
    const fetchChildrenStats = async () => {
      if (!userData?.uid) return;
      
      // Temporarily disable actual database fetching to avoid permission errors
      setLoading(false);
      setChildStats({
        total: 0,
        asEditor: 0,
        asViewer: 0
      });
      
      /* 
      try {
        setLoading(true);
        const children = await getUserChildren(userData.uid);
        
        // Count children by access level
        const asEditor = children.filter(child => 
          child.accessLevel === "editor").length;
        const asViewer = children.filter(child => 
          child.accessLevel === "viewer").length;
        
        setChildStats({
          total: children.length,
          asEditor,
          asViewer
        });
      } catch (error) {
        console.error("Error fetching children stats:", error);
      } finally {
        setLoading(false);
      }
      */
    };

    fetchChildrenStats();
  }, [userData?.uid]);

  // Get display name (use firstName, displayName, or username)
  const displayName = userData?.firstName || 
    userData?.displayName || 
    userData?.username || "";

  return (
    <div className="flex justify-between items-start p-4">
      <div className="flex flex-col items-start gap-0">
        <div className="text-6xl font-black">
          Olá,
          <br />
          {capitalizeFirstLetter(displayName)}!
        </div>
        <div className="text-sm font-semibold">@{userData?.username || ""}</div>
        
        {/* Child statistics */}
        {/* {!loading && childStats.total > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium">{childStats.total} criança{childStats.total !== 1 ? 's' : ''}</span>
            {childStats.asEditor > 0 && (
              <span className="ml-1">
                (<span className="text-green-600">{childStats.asEditor} como editor</span>
                {childStats.asViewer > 0 && ', '}
                {childStats.asViewer > 0 && <span className="text-blue-600">{childStats.asViewer} como visualizador</span>})
              </span>
            )}
          </div>
        )} */}
      </div>
      
      {/* Profile Photo */}
      {/* {userData.photoURL && (
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border">
          <Image
            src={userData.photoURL}
            alt="Profile Photo"
            fill
            className="object-cover"
          />
        </div>
      )} */}
    </div>
  );
};

export default UserProfileCard;