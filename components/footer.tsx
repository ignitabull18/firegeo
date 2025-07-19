import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white text-zinc-600 border-t border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src="/firecrawl-logo-with-fire.webp"
              alt="Firecrawl"
              width={120}
              height={25}
            />
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Internal Use Only
          </p>
        </div>
      </div>
    </footer>
  );
}