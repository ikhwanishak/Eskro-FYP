import Header from './Header';
import Head from 'next/head';

export default function Layout({ children, title = 'EscrowSecure' }) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Head>
                <title>{title}</title>
                <meta name="description" content="Secure Escrow Service" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className="flex-grow container py-8 flex items-center justify-center">
                {children}
            </main>

            <footer className="text-center py-6 text-sm text-muted border-t border-gray-100 mt-auto">
                &copy; {new Date().getFullYear()} EscrowSecure. All rights reserved. | <a href="#" className="text-primary hover:underline">Need Help?</a>
            </footer>
        </div>
    );
}
