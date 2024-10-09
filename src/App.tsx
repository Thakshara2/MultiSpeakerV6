import React, { useState, useEffect } from 'react';
import Transcription from './components/Transcription';
import MultiSpeaker from './components/MultiSpeaker';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'transcription' | 'multiSpeaker'>('transcription');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto transition-all duration-300">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">VoiceScribe AI</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white transition-colors duration-200"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <div className="mb-8">
            <nav className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('transcription')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'transcription'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Transcription
              </button>
              <button
                onClick={() => setActiveTab('multiSpeaker')}
                className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 ${
                  activeTab === 'multiSpeaker'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Multi Speaker
              </button>
            </nav>
          </div>
          {activeTab === 'transcription' ? <Transcription darkMode={darkMode} /> : <MultiSpeaker darkMode={darkMode} />}
        </div>
      </div>
    </div>
  );
}

export default App;