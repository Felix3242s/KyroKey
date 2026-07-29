import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  weight: ['300', '400', '600', '700'],
  subsets: ['latin'],
})

export const metadata = {
  title: 'KYRO License Panel',
  description: 'Modern license management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
