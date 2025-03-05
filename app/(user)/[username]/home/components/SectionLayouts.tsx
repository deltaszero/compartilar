"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import calendarImg from "@/app/assets/images/calendar-icon.png";
import familyImg from "@/app/assets/images/family-icon.png";
import supportImg from "@/app/assets/images/support-icon.png";
import Calendar from "../../calendario/components/Calendar";
import KidsGrid from "./KidsGrid";
import KidsGridMobile from "./KidsGridMobile";
import { CurrentWeek } from "./CurrentWeek";
import { FriendList } from "./FriendList";
import { Dayjs } from "dayjs";

interface CalendarSectionProps {
  selectedDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  isMobile: boolean;
}

export const CalendarSection = ({ selectedDate, onDateSelect, isMobile }: CalendarSectionProps) => {
  if (isMobile) {
    return (
      <section className="container mx-auto p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
            <div className="flex flex-col gap-2">
              <h2 className="text-4xl text-secondaryGreen font-semibold">
                Planeje-se para a semana
              </h2>
              <p className="text-xs text-gray-700">
                Consulte dias de convivência e agende eventos de forma
                compartilhada.
              </p>
            </div>
          </div>

          <CurrentWeek
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
          />
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 rounded-md relative mx-auto h-[8em] bg-mainWeakRed border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold z-10 max-w-[66%]">
            Calendário
          </h2>
          <p className="text-xs text-gray-700">
            Consulte dias de convivência e agende eventos de forma
            compartilhada.
          </p>
        </div>
        <Image
          src={calendarImg}
          alt="Calendar"
          priority
          quality={75}
          className="object-contain"
          width={128}
          height={128}
        />
      </div>
      <div className="bg-base-100 rounded-xl py-4 h-[350px] overflow-y-auto">
        <Calendar />
      </div>
    </div>
  );
};

interface KidsSectionProps {
  parentId: string;
  isMobile: boolean;
}

export const KidsSection = ({ parentId, isMobile }: KidsSectionProps) => {
  if (isMobile) {
    return (
      <section className="container mx-auto p-4">
        <div>
          <div className="flex flex-col gap-2 pb-2">
            <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
              <div className="flex flex-col gap-2">
                <h2 className="text-4xl text-warning font-semibold">
                  Cuide dos seus pequenos
                </h2>
                <p className="text-xs text-gray-700">
                  Adicione, edite e acompanhe as principais informações
                  sobre seus filhos.
                </p>
              </div>
            </div>
          </div>
          <KidsGridMobile parentId={parentId} />
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 rounded-md bg-warning relative mx-auto h-[8em] bg-mainStrongYellow border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold z-10 max-w-[66%]">
            Petiz
          </h2>
          <p className="text-xs text-gray-700">
            Educação, Saúde, Hobbies e outras informações essenciais
            sobre seus filhos.
          </p>
        </div>
        <Image
          src={familyImg}
          alt="Family"
          priority
          quality={75}
          className="object-contain"
          width={128}
          height={128}
        />
      </div>
      <div className="bg-base-100 rounded-xl">
        <div className="py-4">
          <KidsGrid parentId={parentId} />
        </div>
      </div>
    </div>
  );
};

interface SupportNetworkSectionProps {
  userId: string;
  username: string;
  isMobile: boolean;
  onInviteClick: () => void;
}

export const SupportNetworkSection = ({ 
  userId, 
  username, 
  isMobile, 
  onInviteClick 
}: SupportNetworkSectionProps) => {
  if (isMobile) {
    return (
      <section className="container mx-auto p-4">
        {/* Banner/Header */}
        <div className="flex items-center justify-between px-4 rounded-lg bg-purpleShade01 relative mx-auto shadow-xl h-[8em] mb-4 overflow-hidden">
          <div className="flex flex-col gap-2 z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Rede de Apoio
            </h2>
            <p className="text-xs text-white max-w-[90%]">
              Pessoas queridas que provam que juntos somos mais fortes!
            </p>
          </div>
          <Image
            src={supportImg}
            alt="Support Network"
            priority
            quality={75}
            className="object-contain absolute right-0 bottom-0"
            width={96}
            height={96}
          />
        </div>

        {/* Content Area */}
        <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden">
          {/* Friend List - always visible */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Amigos e Família</h3>
              <Button 
                onClick={onInviteClick}
                className="gap-1"
                size="sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Convidar
              </Button>
            </div>
            <FriendList userId={userId} />
          </div>

          <div className="flex justify-center pb-4">
            <Link
              href={`/${username}/rede`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
            >
              Ver página completa da rede
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="col-span-2 flex flex-col gap-4">
      {/* Banner/Header */}
      <div className="flex items-center justify-between px-4 rounded-lg bg-purpleShade01 relative mx-auto shadow-xl h-[8em] overflow-hidden">
        <div className="flex flex-col gap-2 z-10">
          <h2 className="text-3xl font-bold text-white">
            Rede de Apoio
          </h2>
          <p className="text-xs text-white max-w-[70%]">
            Pessoas queridas que provam que juntos somos mais fortes!
          </p>
        </div>
        <Image
          src={supportImg}
          alt="Support Network"
          priority
          quality={75}
          className="object-contain absolute right-0 bottom-0"
          width={128}
          height={128}
        />
      </div>

      {/* Content Area */}
      <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden">
        {/* Friend List - always visible */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Amigos e Família</h3>
            <Button 
              onClick={onInviteClick}
              className="gap-1"
              size="sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Convidar
            </Button>
          </div>
          <FriendList userId={userId} />
        </div>
      </div>
    </div>
  );
};