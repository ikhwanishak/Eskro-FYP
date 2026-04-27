import "@/styles/globals.css";
import InactivityTimeout from "../components/InactivityTimeout";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Script src="https://cdn.tailwindcss.com" strategy="afterInteractive" />
      <InactivityTimeout>
        <Component {...pageProps} />
      </InactivityTimeout>
    </>
  );
}
