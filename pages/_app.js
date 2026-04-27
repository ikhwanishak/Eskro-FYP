import "@/styles/globals.css";
import InactivityTimeout from "../components/InactivityTimeout";

export default function App({ Component, pageProps }) {
  return (
    <InactivityTimeout>
      <Component {...pageProps} />
    </InactivityTimeout>
  );
}
