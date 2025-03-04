"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { KidInfo } from "../types";
import { ChildCard } from "./ChildCard";

export const fetchChildren = async (parentId: string): Promise<KidInfo[]> => {
  const q = query(
    collection(db, "children"),
    where("parentId", "==", parentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
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
};

const KidsGrid = ({ parentId }: { parentId: string }) => {
  const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const data = await fetchChildren(parentId);
        setKidsArray(data);
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
  }, [parentId]);

  if (loading)
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );

  if (!kidsArray.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {kidsArray.map((kid) => (
        <div key={kid.id}>
          <ChildCard kid={kid} />
        </div>
      ))}
    </div>
  );
};

export default KidsGrid;