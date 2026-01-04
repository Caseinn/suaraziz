import Header from "@/components/header"
import Footer from "@/components/footer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* flex-1 makes main take remaining height, pushing Footer down */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-10 sm:px-6 md:px-8 lg:px-10">
        {children}
      </main>
      <Footer />
    </>
  )
}

