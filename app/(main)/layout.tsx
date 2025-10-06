import Header from "@/components/header"
import Footer from "@/components/footer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* flex-1 makes main take remaining height, pushing Footer down */}
      <main className="max-w-4xl mx-auto p-6 flex-1 w-full">{children}</main>
      <Footer />
    </>
  )
}

