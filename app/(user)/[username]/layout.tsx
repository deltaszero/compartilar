// app/(user)/[username]/layout.tsx
import Sidebar from "@components/Sidebar";
import ContentArea from "@components/ContentArea";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex font-nunito">
            {/* Sidebar */}
            <div className="w-1/5 bg-neutral text-neutral-content">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="w-4/5 p-6">
                <ContentArea>{children}</ContentArea>
            </div>
        </div>
    );
}