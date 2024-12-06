import "../styles/globals.css";
import Link from "next/link";
import { WalletProvider } from '../contexts/WalletContext';

export const metadata = {
  title: 'Secret Heist',
  icons: {
    icon: '/assets/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <WalletProvider>
          <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-center space-x-8">
              <Link 
                href="/" 
                className="text-white hover:text-gray-300 transition"
              >
                盗宝行动
              </Link>
              <Link 
                href="/create-task" 
                className="text-white hover:text-gray-300 transition"
              >
                任务发布
              </Link>
            </div>
          </nav>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
