import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#1B1B1B] text-[#E0E0E0]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <section className="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded border border-[#3D3D3D] bg-[#242424] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#9C55E8]">
              404
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Halaman tidak ditemukan
            </h1>
            <p className="max-w-xl text-sm leading-6 text-[#8A8A8A] sm:text-base">
              Alamat ini kosong, pindah, atau memang tidak pernah ada. Cek URL lalu balik ke dashboard.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded bg-[#774AA4] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6A3E92]"
              >
                Ke dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded border border-[#3D3D3D] bg-[#242424] px-4 py-2 text-sm font-semibold text-[#E0E0E0] transition-colors hover:bg-[#2D2D2D]"
              >
                Ke beranda
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-[#3D3D3D] bg-[#242424] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
            <div className="grid gap-3">
              <div className="rounded border border-[#3D3D3D] bg-[#1B1B1B] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A8A8A]">Status</div>
                <div className="mt-1 text-lg font-semibold text-[#1ABE71]">Tidak ada resource</div>
              </div>
              <div className="rounded border border-[#3D3D3D] bg-[#1B1B1B] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A8A8A]">Saran cepat</div>
                <ul className="mt-2 space-y-1 text-sm text-[#E0E0E0]">
                  <li>• Cek kembali link</li>
                  <li>• Kembali ke halaman sebelumnya</li>
                  <li>• Cari menu dari dashboard</li>
                </ul>
              </div>
              <div className="rounded border border-[#3D3D3D] bg-[#1B1B1B] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-[#8A8A8A]">Catatan</div>
                <p className="mt-2 text-sm leading-6 text-[#8A8A8A]">
                  Flat design, density tinggi, warna Datadog-style. No dekorasi berlebih.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
