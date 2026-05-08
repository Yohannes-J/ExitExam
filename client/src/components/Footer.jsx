export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900/95 backdrop-blur-sm text-white mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 xl:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-lg mb-1">
              <span className="text-indigo-400">🎓</span>
              <span className="text-white">ExitExam</span>
              <span className="text-gray-500 font-normal text-sm">Platform</span>
            </div>
            <p className="text-gray-500 text-xs">Empowering students through digital assessment</p>
          </div>

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-8">
            <a href="mailto:yohannesjohn126@gmail.com"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group">
              <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-indigo-600/30 flex items-center justify-center transition">✉️</span>
              <span>yohannesjohn126@gmail.com</span>
            </a>
            <a href="tel:+251924164994"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition group">
              <span className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-indigo-600/30 flex items-center justify-center transition">📞</span>
              <span>0924 164 994</span>
            </a>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="border-t border-white/5 mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span>© {year} ExitExam Platform. All rights reserved.</span>
          <span className="text-gray-700">Built with React · Express · MongoDB</span>
        </div>
      </div>
    </footer>
  );
}
