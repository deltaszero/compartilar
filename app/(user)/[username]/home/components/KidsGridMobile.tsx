"use client";
import { useState, useEffect } from "react";
import { KidInfo } from "../types";
import { fetchChildren } from "./KidsGrid";
import { ChildCardMobile } from "./ChildCardMobile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const KidsGridMobile = ({ parentId }: { parentId: string }) => {
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

  if (!kidsArray.length) {
    return (
      <Card className="p-6 text-center">
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
          <Button className="mt-2">Adicionar criança</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {kidsArray.map((kid) => (
        <div key={kid.id}>
          <ChildCardMobile kid={kid} />
        </div>
      ))}
    </div>
  );
};

export default KidsGridMobile;