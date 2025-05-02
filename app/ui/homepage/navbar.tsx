"use client";

import { useState } from "react";
import { russoOne } from "@/app/ui/fonts";
import Image from "next/image";
import Link from "next/link";
import SignOutButton from "@/app/ui/singOutButton";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (pathname === "/login") {
    return null;
  }

  return (
    <div className="relative w-full">
      <nav className="w-full flex items-center justify-between p-4 bg-slate-900">
        <div
          className={`${russoOne.className} text-gray-100 font-bold text-3xl  bg-gray-900  `}
        >
          MyTrack
        </div>
        {pathname !== "/" && (
          <Link
            href="/"
            className="border-2 border-gray-100 bg-blue-950 w-fit p-2 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-gray-100"
            >
              <path
                fillRule="evenodd"
                d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        )}

        <div className="flex">
          <button onClick={toggleMenu}>
            {isOpen ? (
              <Image
                src="/Close.png"
                alt="Close menu"
                width={40}
                height={40}
                className="hover:cursor-pointer "
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-10 text-gray-100"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
        {isOpen && (
          <div className="w-full bg-slate-800 p-4 absolute top-full left-0 shadow-lg text-gray-100 z-50">
            <div className="flex flex-col items-center justify-center gap-4">
              <Link href="/training/session" onClick={toggleMenu}>
                <div
                  className={`${russoOne.className} bg-blue-800 py-2 px-10 my-3 w-full  rounded-md shadow-xl border-2 border-blue-500 text-gray-100 text-lg cursor-pointer hover:bg-blue-700 hover:scale-95`}
                >
                  Start session
                </div>
              </Link>
              <div className="flex flex-col gap-4 mx-4">
                <div className="flex gap-4">
                  <Link
                    href="/calendar"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6 "
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                      />
                    </svg>
                    <p>Calendar</p>
                  </Link>
                  <Link
                    href="/notes"
                    onClick={toggleMenu}
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="size-6 "
                    >
                      <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                      <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                    </svg>
                    <p>Add Notes</p>
                  </Link>
                </div>
                <div className="flex gap-4">
                  <div
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 `}
                  >
                    <a href="#">Example</a>
                  </div>
                  <div
                    className={`${russoOne.className} flex items-center mx-auto w-35 p-2 gap-2 rounded-md shadow-xl bg-blue-900 border-2 border-blue-500 `}
                  >
                    <a href="#">Example</a>
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-5 mr-0">
                <SignOutButton />
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
