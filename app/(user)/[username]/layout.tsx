import Sidebar from "@components/Sidebar";
import ContentArea from "@components/ContentArea";

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex bg-neutral">
            {/* Sidebar */}
            <div className="w-1/4 bg-gray-800 text-white">
                <Sidebar />
            </div>
            {/* Content Area */}
            <div className="w-3/4 bg-white rounded-tl-3xl p-6">
                <ContentArea>{children}</ContentArea>
            </div>
        </div>
    );
}