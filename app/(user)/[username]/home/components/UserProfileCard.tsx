"use client";
import { SignupFormData } from "../types";

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const UserProfileCard = ({
  userData,
}: {
  userData: Partial<SignupFormData>;
}) => (
  <div className="flex justify-between items-start p-4">
    <div className="flex flex-col items-start gap-0">
      <div className="text-6xl font-semibold">
        Olá,
        <br />
        {capitalizeFirstLetter(userData.firstName || "")}!
      </div>
      <div className="text-sm font-semibold">@{userData.username}</div>
    </div>
    {/* Notification bell removed for now */}
  </div>
);

export default UserProfileCard;