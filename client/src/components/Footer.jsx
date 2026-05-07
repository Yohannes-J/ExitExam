export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-indigo-800 text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-lg mb-1">
              <span>🎓</span>
              <span>ExitExam Platform</span>
            </div>
            <p className="text-indigo-300 text-xs">Empowering students through digital assessment</p>
          </div>

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-indigo-200">
            <a href="mailto:yohannesjohn@gmail.com"
              className="flex items-center gap-1.5 hover:text-white transition">
              <span>✉️</span>
              <span>yohannesjohn126@gmail.com</span>
            </a>
            <a href="tel:+251924164994"
              className="flex items-center gap-1.5 hover:text-white transition">
              <span>📞</span>
              <span>0924 164 994</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-indigo-700 mt-4 pt-4 text-center text-xs text-indigo-400">
          © {year} ExitExam Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
