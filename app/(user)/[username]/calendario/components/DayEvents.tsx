import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { DayEventsProps } from "./types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DayEvents({
  selectedDate,
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent
}: DayEventsProps) {
  const categoryColors = {
    school: 'bg-blue-500',
    medical: 'bg-red-500',
    activity: 'bg-green-500',
    visitation: 'bg-purple-500',
    other: 'bg-gray-500'
  };

  return (
    // <div className="h-full border-4 border-black p-3 sm:p-4 bg-white shadow-brutalist">
     <div className="h-full border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="font-bold text-base sm:text-lg line-clamp-2">
          {selectedDate 
            ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })
            : "Selecione uma data"}
        </h3>
        
        {selectedDate && (
          <Button 
            variant="default"
            onClick={() => selectedDate && onAddEvent(selectedDate)}
            className="bg-secondaryMain border-2 border-black shadow-brutalist-sm hover:translate-y-1 transition-transform flex items-center gap-1 h-8 text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Adicionar</span>
          </Button>
        )}
      </div>
      
      {!selectedDate && (
        <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] border-2 border-dashed border-gray-300 p-4">
          <p className="text-muted-foreground text-center text-sm">
            Selecione uma data para ver ou criar eventos
          </p>
        </div>
      )}
      
      {selectedDate && events.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] border-2 border-dashed border-gray-300 p-4">
          <p className="text-muted-foreground text-center text-sm">
            Nenhum evento para esta data.
          </p>
          <Button 
            variant="default" 
            onClick={() => selectedDate && onAddEvent(selectedDate)}
            className="bg-secondaryMain mt-4 border-2 border-black shadow-brutalist-sm hover:translate-y-1 transition-transform text-xs sm:text-sm h-8 sm:h-10"
          >
            Criar um evento
          </Button>
        </div>
      )}
      
      {selectedDate && events.length > 0 && (
        <div className="space-y-3 mt-2 max-h-[calc(100vh-250px)]">
          {events.map((event) => (
            <div key={event.id} className="border-2 border-black p-3 sm:p-4 bg-white shadow-brutalist">
              <div className="flex justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${categoryColors[event.category]}`}></div>
                    <h4 className="font-bold text-sm sm:text-base truncate">{event.title}</h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Badge variant="default" className="bg-white border-black text-[10px] sm:text-xs">
                      {format(event.startTime.toDate(), 'HH:mm')}
                      {' - '}
                      {format(event.endTime.toDate(), 'HH:mm')}
                    </Badge>
                    
                    {event.location?.address && (
                      <Badge variant="default" className="bg-white border-black text-[10px] sm:text-xs mt-1 sm:mt-0">
                        {event.location.address}
                      </Badge>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-xs sm:text-sm mt-2 line-clamp-2">{event.description}</p>
                  )}
                  
                  {event.childName && (
                    <div className="flex items-center gap-1 mt-2">
                      {event.childPhotoURL ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden border border-black">
                          <Image 
                            src={event.childPhotoURL} 
                            alt={event.childName}
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 border border-black"></div>
                      )}
                      <span className="text-[10px] sm:text-xs">{event.childName}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 ml-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => selectedDate && onEditEvent(selectedDate, event)}
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded border-2 border-black hover:bg-black hover:text-white transition-colors p-0"
                  >
                    <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDeleteEvent(event.id)}
                    className="h-6 w-6 sm:h-7 sm:w-7 rounded border-2 border-red-800 hover:bg-red-800 hover:text-white transition-colors p-0"
                  >
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}