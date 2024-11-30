// app/(user)/[username]/layout.tsx
import Sidebar from "@components/Sidebar";
import ContentArea from "@components/ContentArea";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex">
            {/* Sidebar */}
            <div className="w-1/4 bg-neutral text-base-100 font-raleway">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="w-3/4 p-6">
                <ContentArea>{children}</ContentArea>
            </div>
        </div>
    );
}