"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardHeader,
  // CardTitle,
  // CardFooter,
} from "@/components/ui/card";
import { 
  Plus, 
  School, 
  Activity, 
  HeartPulse, 
  Users, 
  HelpCircle,
  Edit,
  Trash2
} from "lucide-react";
import dayjs from "dayjs";
import { DayEventsProps, EventItemProps } from "./types"; // import { DayEventsProps, EventItemProps, CalendarEventWithChild } from "./types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getCategoryIcon(category: string) {
  switch (category) {
    case "school":
      return <School className="h-4 w-4 text-blue-500" />;
    case "activity":
      return <Activity className="h-4 w-4 text-green-500" />;
    case "medical":
      return <HeartPulse className="h-4 w-4 text-red-500" />;
    case "visitation":
      return <Users className="h-4 w-4 text-purple-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
  }
}

function EventItem({ event, onEdit, onDelete }: EventItemProps) {
  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            <div className="mt-0.5">{getCategoryIcon(event.category)}</div>
            <div>
              <h4 className="font-medium text-sm">{event.title}</h4>
              <div className="text-xs text-muted-foreground">
                {dayjs(event.startTime.toDate()).format("HH:mm")} - 
                {dayjs(event.endTime.toDate()).format("HH:mm")}
              </div>
              
              {event.description && (
                <p className="text-xs mt-1 text-muted-foreground">
                  {event.description}
                </p>
              )}
              
              {event.childName && (
                <div className="flex items-center mt-1 space-x-1">
                  <Avatar className="h-4 w-4">
                    {event.childPhotoURL && (
                      <AvatarImage src={event.childPhotoURL} alt={event.childName} />
                    )}
                    <AvatarFallback className="text-[8px]">
                      {event.childName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{event.childName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={onEdit}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-destructive" 
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DayEvents({ 
  selectedDate, 
  events, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent 
}: DayEventsProps) {
  if (!selectedDate) {
    return null;
  }

  const isToday = selectedDate.isSame(dayjs(), "day");
  
  return (
    <div className="p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className={cn(
            "text-lg font-semibold",
            isToday && "text-primary"
          )}>
            {selectedDate.format("DD MMMM YYYY")}
            {isToday && <span className="ml-2 text-xs font-normal bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Hoje</span>}
          </h3>
        </div>
        
        <Button size="sm" onClick={() => onAddEvent(selectedDate)}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>
      
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Não há eventos para este dia</p>
            <Button 
              variant="link" 
              onClick={() => onAddEvent(selectedDate)}
              className="mt-2"
            >
              Adicionar evento
            </Button>
          </div>
        ) : (
          events.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onEdit={() => onEditEvent(selectedDate, event)}
              onDelete={() => onDeleteEvent(event.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}