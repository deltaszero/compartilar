'use client'
// import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function Home() {
    return (
        <section className="py-24">
            <div className="container">
                <h1 className="mt-4 text-3xl font-bold">
                    Hello, world!
                </h1>
            </div>
        </section>
    );
}