export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ShopHub — Built with React, Cloudflare Workers & D1.
      </div>
    </footer>
  );
}
