import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "WhatsBit — منصة واتساب أعمال متكاملة من المدار",
  description:
    "نظّم محادثات عملائك، وأتمت ردودك، وأطلق حملاتك من منصة واحدة، عبر الواجهة الرسمية لواتساب للأعمال.",
};

// A signed-in customer opening the site goes straight to their dashboard, before the
// landing page paints. Everyone else gets the landing page, with its own login button.
const SIGNED_IN_REDIRECT =
  "try{if(localStorage.getItem('auth_token'))location.replace('/dashboard')}catch(e){}";

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SIGNED_IN_REDIRECT }} />
      <Landing />
    </>
  );
}
