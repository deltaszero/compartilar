"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { KidInfo } from "../types";
import { ChildCard } from "./ChildCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const fetchChildren = async (userId: string): Promise<KidInfo[]> => {
  try {
    // Query children where the user is either a viewer or editor
    const editorsQuery = query(
      collection(db, "children"),
      where("editors", "array-contains", userId)
    );
    
    const viewersQuery = query(
      collection(db, "children"),
      where("viewers", "array-contains", userId)
    );
    
    // Execute both queries in parallel
    const [editorsSnapshot, viewersSnapshot] = await Promise.all([
      getDocs(editorsQuery),
      getDocs(viewersQuery)
    ]);
    
    // Track unique children to avoid duplicates
    const uniqueChildren = new Map();
    
    // Process children where user is an editor
    editorsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip deleted children
      if (data.isDeleted === true) {
        console.log(`Skipping deleted child ${doc.id} (editor access) in KidsGrid`);
        return;
      }
      
      uniqueChildren.set(doc.id, {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate,
        gender: data.gender,
        relationship: data.relationship,
        photoURL: data.photoURL || null,
        accessLevel: 'editor',
        isDeleted: data.isDeleted || false
      });
    });
    
    // Process children where user is a viewer (only add if not already added as editor)
    viewersSnapshot.docs.forEach(doc => {
      if (!uniqueChildren.has(doc.id)) {
        const data = doc.data();
        
        // Skip deleted children
        if (data.isDeleted === true) {
          console.log(`Skipping deleted child ${doc.id} (viewer access) in KidsGrid`);
          return;
        }
        
        uniqueChildren.set(doc.id, {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: data.birthDate,
          gender: data.gender, 
          relationship: data.relationship,
          photoURL: data.photoURL || null,
          accessLevel: 'viewer',
          isDeleted: data.isDeleted || false
        });
      }
    });
    
    // Convert Map to array
    return Array.from(uniqueChildren.values());
  } catch (error) {
    console.error("Error fetching children:", error);
    return [];
  }
};

const KidsGrid = ({ parentId }: { parentId: string }) => {
  const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const data = await fetchChildren(parentId);
        
        // Double-check to filter out any deleted children that might have slipped through
        const filteredData = data.filter(child => !child.isDeleted);
        
        if (filteredData.length !== data.length) {
          console.log(`Filtered out ${data.length - filteredData.length} deleted children in KidsGrid component`);
        }
        
        setKidsArray(filteredData);
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

  if (!kidsArray.length) {
    return (
      <Card className="bg-bw rounded-none p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          {/* <div className="relative w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">👶</span>
          </div> */}
          <div>
            <h3 className="font-medium mb-1">Nenhuma criança cadastrada</h3>
            <p className="text-sm text-muted-foreground">
              Adicione informações sobre seus filhos para acompanhar seu desenvolvimento
            </p>
          </div>
          <Button 
            className="mt-2 bg-secondaryMain" 
            variant="default"
            onClick={() => router.push(`/${username}/criancas/novo`)}
          >
            Adicionar criança
          </Button>
        </div>
      </Card>
    );
  }

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