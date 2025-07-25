import React, { ReactNode } from "react";

// Types
import { InvoiceType } from "@/types";

type InvoiceLayoutProps = {
    data: InvoiceType;
    children: ReactNode;
};

export default function InvoiceLayout({ data, children }: InvoiceLayoutProps) {
    const { details } = data;

    // Font loading is now handled by installing fonts directly into the Docker image.
    // The <link> tags for Google Fonts have been removed to ensure offline capability.
    const head = (
        <>
            {/* Font links removed. Fonts are now local to the system. */}
        </>
    );

    return (
        <>
            {head}
            <section style={{ fontFamily: "Outfit, 'Noto Sans SC', sans-serif" }}>
                <div className="flex flex-col p-4 sm:p-10 bg-white rounded-xl min-h-[60rem]">
                    {children}
                </div>
            </section>
        </>
    );
}
