import { Manrope, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata = {
  title: "CountryFarm Live Booking",
  description: "Production-ready live country chicken booking platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand">
                CountryFarm
              </Link>
              <nav className="site-nav">
                <Link href="/">Home</Link>
                <Link href="/order">Book</Link>
                <Link href="/admin">Admin</Link>
              </nav>
            </div>
          </header>

          <div className="site-main">{children}</div>

          <footer className="site-footer">
            <div className="site-footer-inner">
              <p>CountryFarm Live Booking</p>
              <p>Fresh country chicken. Slot-based delivery. COD supported.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
