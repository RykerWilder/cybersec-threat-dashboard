import React from "react";

const Header = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="p-10 max-w-[1500px] w-full mx-auto flex">
            <span className="w-full border-t border-slate-400 text-slate-400 text-center p-10">&copy; {currentYear} | All rights are reserved | Developed by RykerWilder </span>
        </footer>
    );
};

export default Header;