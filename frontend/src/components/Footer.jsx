import React from "react";

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="mt-16 border-t border-ink-600 bg-ink-900">
            <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-5 py-8 text-[13px] text-fg-3 lg:px-10">
                <p className="max-w-3xl leading-6">
                    Data from ISC SANS, NVD NIST and VirusTotal. The Kaspersky and Check Point maps are
                    embedded from their providers and remain their property. Kaspersky's map shows
                    detection events, not the exact physical location of an attacker.
                </p>
                <div className="flex flex-col justify-between gap-2 border-t border-ink-600 pt-4 sm:flex-row">
                    <span>&copy; {currentYear} All rights are reserved</span>
                    <span>Developed by RykerWilder</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
