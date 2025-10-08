import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2 } from 'lucide-react';
import { Github, Twitter } from 'lucide-react';
export function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) navigate('/builder', { state: { prompt } });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-gray-800/80 backdrop-blur-md shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">AiForge</span>
          </div>
          <div className="hidden md:flex gap-8 items-center text-gray-300">
            <a href="#why" className="hover:text-white transition-colors">Why Us</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <a href="#footer" className="hover:text-white transition-colors">Contact</a>
            <button
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-lg text-white font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-28 pb-32 px-6 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight animate-fade-in">Build Your Dream Website<br className="hidden md:block"/> with AI</h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-10 animate-fade-in delay-200">Describe your dream website, and our AI will craft it for you effortlessly.</p>
        <form onSubmit={handleSubmit} className="w-full max-w-2xl animate-fade-in delay-400">
          <div className="bg-gray-800/90 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 backdrop-blur-md border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the website you want to build..."
              className="w-full h-36 p-4 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none placeholder-gray-400"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-3 rounded-lg font-semibold text-white shadow-lg hover:scale-105 transition-transform"
            >
              Generate Plan
            </button>
          </div>
        </form>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-16 animate-fade-in">Why Choose AiForge </h2>
        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {[
            { title: "AI Powered", text: "Automate your website creation with precision and speed." },
            { title: "Step by Step", text: "Follow an intuitive guided process for building your dream website." },
            { title: "Customizable", text: "Full control to tweak design and content to match your brand." },
          ].map((item, i) => (
            <div key={i} className="bg-gray-800/80 rounded-2xl p-8 shadow-2xl hover:scale-105 transition-transform duration-300 backdrop-blur-md border border-gray-700">
              <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-gray-900 text-center">
        <h2 className="text-4xl font-bold mb-16 animate-fade-in">Testimonials</h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            { name: "Alice", text: "This AI builder saved me weeks of work!" },
            { name: "Bob", text: "Step-by-step guidance made building easy and fun." },
            { name: "Charlie", text: "Customizable templates made my website unique." },
          ].map((t, i) => (
            <div key={i} className="bg-gray-800/80 rounded-2xl p-6 shadow-2xl hover:scale-105 transition-transform duration-300 backdrop-blur-md border border-gray-700">
              <p className="text-gray-300 mb-4">"{t.text}"</p>
              <p className="font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 text-center">
        <h2 className="text-4xl font-bold mb-16 animate-fade-in">FAQ</h2>
        <div className="max-w-4xl mx-auto text-left space-y-6">
          {[
            { q: "Do I need coding skills?", a: "No, the AI builder handles everything for you." },
            { q: "Can I customize the design?", a: "Yes, edit files and preview changes in real time." },
            { q: "Is it free?", a: "Currently free with some limitations." },
          ].map((f, i) => (
            <div key={i} className="bg-gray-800/80 p-6 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300 backdrop-blur-md border border-gray-700">
              <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
              <p className="text-gray-300">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gray-900 py-12 px-6 text-center text-gray-400">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://github.com" target="_blank" className="hover:text-white transition-colors"><Github className="w-6 h-6"/></a>
          <a href="https://twitter.com" target="_blank" className="hover:text-white transition-colors"><Twitter className="w-6 h-6"/></a>
        </div>
        <p>© {new Date().getFullYear()} AiForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
