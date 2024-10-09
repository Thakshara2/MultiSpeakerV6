import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileAudio, Loader2, Download, Plus } from 'lucide-react';
import { AssemblyAI } from 'assemblyai';

const ASSEMBLY_AI_API_KEY = import.meta.env.VITE_ASSEMBLY_AI_API_KEY;
const MAX_FILE_SIZE = 800 * 1024 * 1024; // 800MB in bytes

interface Utterance {
  id: string;
  speaker: string;
  text: string;
}

function MultiSpeaker({ darkMode }: { darkMode: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [diarization, setDiarization] = useState<Utterance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [speakersExpected, setSpeakersExpected] = useState<number>(2);

  useEffect(() => {
    if (!ASSEMBLY_AI_API_KEY) {
      setError('AssemblyAI API key is missing. Please check your environment variables.');
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('File size exceeds 800MB limit. Please choose a smaller file.');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    if (!ASSEMBLY_AI_API_KEY) {
      setError('AssemblyAI API key is missing. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError('');
    setDiarization([]);
    setProgress(0);

    const client = new AssemblyAI({
      apiKey: ASSEMBLY_AI_API_KEY
    });

    try {
      const transcript = await client.transcripts.transcribe({
        audio: file,
        speaker_labels: true,
        speakers_expected: speakersExpected,
      }, (progress) => {
        setProgress(progress);
      });

      if (transcript.status === 'error') {
        throw new Error(`Diarization failed: ${transcript.error}`);
      }

      if (transcript.utterances) {
        const processedDiarization = transcript.utterances.map((utterance, index) => ({
          id: `utterance-${index}`,
          speaker: `Speaker ${utterance.speaker}`,
          text: utterance.text
        }));
        setDiarization(processedDiarization);
      } else {
        setError('No utterances found in the diarization result.');
      }
    } catch (error) {
      console.error('Diarization error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file, speakersExpected]);

  const handleDownload = () => {
    const content = diarization.map(utterance => `${utterance.speaker}: ${utterance.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diarization.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSpeakerChange = (id: string, newSpeaker: string) => {
    setDiarization(prev => prev.map(utterance =>
      utterance.id === id ? { ...utterance, speaker: newSpeaker } : utterance
    ));
  };

  const handleEdit = (id: string) => {
    const utteranceToEdit = diarization.find(u => u.id === id);
    if (utteranceToEdit) {
      setEditingId(id);
      setEditingText(utteranceToEdit.text);
    }
  };

  const handleSaveEdit = () => {
    setDiarization(prev => prev.map(utterance =>
      utterance.id === editingId ? { ...utterance, text: editingText } : utterance
    ));
    setEditingId(null);
  };

  const handleAddUtterance = (index: number) => {
    const newUtterance: Utterance = { id: `utterance-${Date.now()}`, speaker: 'Speaker A', text: '' };
    setDiarization(prev => [
      ...prev.slice(0, index + 1),
      newUtterance,
      ...prev.slice(index + 1)
    ]);
  };

  return (
    <div>
      <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Most Accurate Multi-Speaker Audio Transcriptions</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file-diarization" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <FileAudio className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              ) : (
                <Upload className={`w-12 h-12 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
              <p className={`mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MP3, MP4, or WAV (MAX. 800MB)</p>
            </div>
            <input
              id="dropzone-file-diarization"
              type="file"
              className="hidden"
              accept=".mp3,.mp4,.wav"
              onChange={handleFileChange}
            />
          </label>
        </div>
        {file && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-center`}>
            Selected file: {file.name}
          </p>
        )}
        <div>
          <label htmlFor="speakers-expected" className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Expected number of speakers:
          </label>
          <input
            type="number"
            id="speakers-expected"
            value={speakersExpected}
            onChange={(e) => setSpeakersExpected(Math.max(2, parseInt(e.target.value)))}
            min="2"
            className={`w-full p-2 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
          />
        </div>
        <button
          type="submit"
          disabled={!file || isLoading || !ASSEMBLY_AI_API_KEY}
          className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            'Transcribe'
          )}
        </button>
      </form>
      {error && (
        <p className="mt-4 text-red-600 text-center">{error}</p>
      )}
      {isLoading && (
        <div className="mt-4">
          <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2.5`}>
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Transcription progress: {progress.toFixed(2)}%</p>
        </div>
      )}
      {diarization.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Transcription Result:</h2>
            <button
              onClick={handleDownload}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              <Download className="mr-2" size={16} />
              Download
            </button>
          </div>
          <div className="space-y-4">
            {diarization.map((utterance, index) => (
              <div key={utterance.id} className="flex items-start space-x-2">
                <select
                  value={utterance.speaker}
                  onChange={(e) => handleSpeakerChange(utterance.id, e.target.value)}
                  className={`p-2 border rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-700'}`}
                >
                  {Array.from({ length: speakersExpected }, (_, i) => `Speaker ${String.fromCharCode(65 + i)}`).map((speaker) => (
                    <option key={speaker} value={speaker}>{speaker}</option>
                  ))}
                </select>
                {editingId === utterance.id ? (
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={handleSaveEdit}
                    className={`flex-grow p-2 border rounded ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-700'}`}
                    autoFocus
                  />
                ) : (
                  <p 
                    className={`flex-grow cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}
                    onClick={() => handleEdit(utterance.id)}
                  >
                    {utterance.text}
                  </p>
                )}
                <button onClick={() => handleAddUtterance(index)} className={`p-2 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSpeaker;