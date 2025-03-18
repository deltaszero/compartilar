import { cn } from "@/lib/utils";

interface SectionTitleProps {
    title: string;
    className?: string;
}

export default function SectionTitle({ title, className }: SectionTitleProps) {
    return (
        <div
            className={cn(
                "flex flex-row justify-center items-center text-center text-xl py-12 px-4 font-bold font-raleway",
                "sm:text-4xl sm:px-0",
                className
            )}>
            <span className={cn(
                "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] px-6 py-3"
            )}>
                {title}
            </span>
        </div>
    );
}