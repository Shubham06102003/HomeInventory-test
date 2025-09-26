
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { useIsMobile } from '@/hooks/use-mobile'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function Header({ title, navLinks = [] }) {
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo or icon can be added here if needed */}
            <Link href="/family">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-150">{title}</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isMobile ? (
              <div className="relative">
                <button
                  className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 focus:outline-none"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6 text-gray-700" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
                    <nav className="flex flex-col">
                      {navLinks.map(({ href, label, icon: Icon }, idx) => (
                        <Link
                          key={idx}
                          href={href}
                          className="px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => setMenuOpen(false)}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <>
                <nav className="flex items-center gap-4">
                  {navLinks.map(({ href, label, icon: Icon }, idx) => (
                    <Link key={idx} href={href} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                      {Icon && <Icon className="h-4 w-4" />}
                      {label}
                    </Link>
                  ))}
                </nav>
                <UserButton afterSignOutUrl="/" />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
